import { deflateRawSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PRIVATE_BLOGS, STATIC_BLOGS } from "../src/data/privateBlogs.js";

const liveBlogs = JSON.parse(await readFile(join(process.cwd(), ".tmp-live-blogs.json"), "utf8"));
const outputDirectory = join(process.cwd(), "exports");
const outputPath = join(outputDirectory, "ilika-blog-list.xlsx");

const escapeXml = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const safeText = (value = "") => {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const displayDateTime = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const date = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  });
};

const blogs = [
  ...STATIC_BLOGS.map((blog) => ({ ...blog, source: "Website static" })),
  ...PRIVATE_BLOGS.map((blog) => ({ ...blog, source: "Website private" })),
  ...liveBlogs.map((blog) => ({ ...blog, source: "Live CMS" })),
].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

const headers = ["Title", "Author / Name", "Published date & time", "Last updated", "Source"];
const rows = [headers, ...blogs.map((blog) => [
  blog.title || "", blog.author || "", displayDateTime(blog.createdAt), displayDateTime(blog.updatedAt), blog.source,
])];

const columnName = (index) => {
  let result = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
};
const cell = (value, rowIndex, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(safeText(value))}</t></is></c>`;
const worksheetRows = rows.map((values, rowIndex) => `<row r="${rowIndex + 1}">${values.map((value, columnIndex) => cell(value, rowIndex + 1, columnIndex)).join("")}</row>`).join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="All Blogs" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf xfId="0"/></cellXfs></styleSheet>`,
  "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="65" customWidth="1"/><col min="2" max="2" width="20" customWidth="1"/><col min="3" max="4" width="25" customWidth="1"/><col min="5" max="5" width="18" customWidth="1"/></cols><sheetData>${worksheetRows}</sheetData><autoFilter ref="A1:E${rows.length}"/></worksheet>`,
};

let crcTable;
const crc32 = (buffer) => {
  crcTable ??= Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    return value >>> 0;
  });
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const uint16 = (value) => { const data = Buffer.alloc(2); data.writeUInt16LE(value); return data; };
const uint32 = (value) => { const data = Buffer.alloc(4); data.writeUInt32LE(value); return data; };

const parts = [], centralDirectory = [];
let offset = 0;
for (const [name, content] of Object.entries(files)) {
  const filename = Buffer.from(name);
  const raw = Buffer.from(content, "utf8");
  const compressed = deflateRawSync(raw);
  const crc = crc32(raw);
  const localHeader = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), uint16(20), uint16(0), uint16(8), uint16(0), uint16(0), uint32(crc), uint32(compressed.length), uint32(raw.length), uint16(filename.length), uint16(0), filename]);
  parts.push(localHeader, compressed);
  centralDirectory.push(Buffer.concat([Buffer.from([0x50, 0x4b, 0x01, 0x02]), uint16(20), uint16(20), uint16(0), uint16(8), uint16(0), uint16(0), uint32(crc), uint32(compressed.length), uint32(raw.length), uint16(filename.length), uint16(0), uint16(0), uint16(0), uint16(0), uint32(0), uint32(offset), filename]));
  offset += localHeader.length + compressed.length;
}
const directory = Buffer.concat(centralDirectory);
const footer = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), uint16(0), uint16(0), uint16(files.length), uint16(files.length), uint32(directory.length), uint32(offset), uint16(0)]);
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, Buffer.concat([...parts, directory, footer]));
console.log(`Created ${outputPath} with ${blogs.length} blog rows.`);
