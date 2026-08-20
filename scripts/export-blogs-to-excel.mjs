import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PRIVATE_BLOGS, STATIC_BLOGS } from "../src/data/privateBlogs.js";

const liveBlogsPath = join(process.cwd(), ".tmp-live-blogs.json");
const outputDirectory = join(process.cwd(), "exports");
const outputPath = join(outputDirectory, "ilika-all-blogs.xls");

const xmlEscape = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const plainText = (html = "") => String(html)
  .replace(/<\s*br\s*\/?>/gi, "\n")
  .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
  .replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

const formatDate = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const date = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

const cell = (value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
const row = (values) => `<Row>${values.map(cell).join("")}</Row>`;
const worksheet = (name, headers, records) => `
  <Worksheet ss:Name="${xmlEscape(name)}">
    <Table>
      ${row(headers)}
      ${records.map((record) => row(record)).join("\n")}
    </Table>
  </Worksheet>`;

let liveBlogs = [];
try {
  liveBlogs = JSON.parse(await readFile(liveBlogsPath, "utf8"));
} catch {
  // The export remains useful when the optional live CMS snapshot is unavailable.
}

const blogs = [
  ...STATIC_BLOGS.map((blog) => ({ ...blog, source: "Repository — public static" })),
  ...PRIVATE_BLOGS.map((blog) => ({ ...blog, source: "Repository — private" })),
  ...liveBlogs.map((blog) => ({ ...blog, source: "Live CMS" })),
];

const indexRows = blogs.map((blog) => [
  blog.source,
  blog.id,
  blog.slug,
  blog.title,
  blog.author,
  formatDate(blog.createdAt),
  formatDate(blog.updatedAt),
  blog.excerpt || blog.shortDesc || "",
  blog.internalLink || "",
  blog.image || "",
  blog.isPrivate ? "Yes" : "No",
  blog.hideFromBlogListing ? "Yes" : "No",
  Array.isArray(blog.targetKeywords) ? blog.targetKeywords.join(", ") : "",
  Array.isArray(blog.contentSections) ? blog.contentSections.length : 0,
]);

const contentRows = blogs.flatMap((blog) => {
  const sections = Array.isArray(blog.contentSections) && blog.contentSections.length
    ? blog.contentSections
    : [{ id: "main-content", type: "content", content: blog.content || "", image: "" }];

  return sections.map((section, index) => [
    blog.source,
    blog.id,
    blog.slug,
    blog.title,
    index + 1,
    section.id || "",
    section.type || "",
    plainText(section.content || ""),
    section.image || "",
  ]);
});

const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style>
  </Styles>
  ${worksheet("Blog Index", ["Source", "ID", "Slug", "Title", "Author", "Created at (UTC)", "Updated at (UTC)", "Excerpt", "Internal link", "Featured image", "Private", "Hidden from listing", "Target keywords", "Content sections"], indexRows)}
  ${worksheet("Blog Content", ["Source", "Blog ID", "Slug", "Title", "Section #", "Section ID", "Section type", "Content (plain text)", "Section image"], contentRows)}
  ${worksheet("Export Notes", ["Item", "Value"], [
    ["Exported at (UTC)", new Date().toISOString()],
    ["Total blogs", blogs.length],
    ["Repository public static blogs", STATIC_BLOGS.length],
    ["Repository private blogs", PRIVATE_BLOGS.length],
    ["Live CMS blogs", liveBlogs.length],
    ["Content format", "Article body is one row per content section; HTML was converted to plain text for readability."],
  ])}
</Workbook>`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, workbook, "utf8");
console.log(`Created ${outputPath} with ${blogs.length} blogs and ${contentRows.length} content rows.`);
