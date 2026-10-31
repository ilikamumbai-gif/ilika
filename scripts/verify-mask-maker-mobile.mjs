import fs from "node:fs";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
const bundle = await build({
  stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import Voice from './src/Landing/VoiceMaskMakerLanding.jsx';import Nonvoice from './src/Landing/NonvoiceMaskMakerLanding.jsx';createRoot(document.getElementById('root')).render(<MemoryRouter>{window.testModel==='voice'?<Voice/>:<Nonvoice/>}</MemoryRouter>);`,resolveDir:process.cwd(),loader:"jsx"},
  bundle:true,write:false,format:"iife",jsx:"automatic",loader:{".css":"empty"},define:{"process.env.NODE_ENV":'"production"',"import.meta.env.VITE_API_URL":'"https://mobile.test"'},
  plugins:[{name:"landing-fixtures",setup(build){
    build.onResolve({filter:/\.(?:png|jpe?g|webp)$/},()=>({path:"image",namespace:"fixture"}));
    build.onResolve({filter:/components\/(Header|Footer|MiniDivider|CartDrawer)$/},args=>({path:args.path.endsWith("/Header")?"header":"shell",namespace:"fixture"}));
    build.onResolve({filter:/context\/ProductContext$/},()=>({path:"products",namespace:"fixture"}));
    build.onResolve({filter:/context\/CartProvider$/},()=>({path:"cart",namespace:"fixture"}));
    build.onResolve({filter:/firebase\/firebaseConfig$/},()=>({path:"auth",namespace:"fixture"}));
    build.onLoad({filter:/.*/,namespace:"fixture"},args=>({resolveDir:process.cwd(),contents:({
      image:'export default "/placeholder.webp";',
      shell:'export default function Shell(){return null;}',
      header:'import React from "react";export default function Header(){return React.createElement("header",{style:{height:72}},"Ilika");}',
      products:'export function useProducts(){return {products:window.testProducts,loading:false};}',
      cart:'export function useCart(){return {addToCart:async item=>{window.cartPayload=item;}};}',
      auth:'export const auth={currentUser:null};',
    })[args.path]}));
  }}],
});
const cssName=fs.readdirSync("dist/assets").find(file=>/^index-.*\.css$/.test(file));
const css=fs.readFileSync(`dist/assets/${cssName}`,"utf8")+fs.readFileSync("src/Landing/MaskMakerLanding.css","utf8")+fs.readFileSync("src/components/product/DiwaliOfferBanner.css","utf8");
const browser=await chromium.launch({headless:true});
try{
 for(const model of ["voice","nonvoice"]){
  for(const width of [320,360,390,430,640,1280]){
   const page=await browser.newPage({viewport:{width,height:844},hasTouch:true});
   const errors=[];page.on("pageerror",error=>errors.push(error.message));
   await page.route("**/*",route=>{
    const pathname=new URL(route.request().url()).pathname;
    const imageFile=`public${pathname}`;
    return route.fulfill(fs.existsSync(imageFile)?{body:fs.readFileSync(imageFile),contentType:"image/webp"}:{body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>',contentType:"image/svg+xml"});
   });
   await page.setContent('<base href="https://mobile.test/"><div id="root"></div>');
   await page.evaluate(({model})=>{window.testModel=model;window.testProducts=[{id:'voice',productUrl:'voice-face-mask-maker',name:'Ilika Voice Face Mask Maker',price:5499,mrp:7999,inStock:true,stock:24,images:['/placeholder.webp']},{id:'nonvoice',productUrl:'non-voice-face-mask-maker',name:'Ilika Non-Voice Face Mask Maker',price:3499,mrp:5999,inStock:true,stock:12,images:['/placeholder.webp']}];},{model});
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:bundle.outputFiles[0].text});
   try { await page.locator('.mask-maker-hero').waitFor({timeout:5000}); } catch(error) { console.log(JSON.stringify({model,width,errors,body:await page.locator('body').innerText()})); throw error; }
   const image=await page.locator('.mask-maker-hero-media img').boundingBox();
   const title=await page.locator('h1').boundingBox();
   assert(image.width<=width && Math.abs(image.width-image.height)<2);
   if(width<640) assert(image.y<title.y,`Artwork order at ${model}/${width}`);
   if(width>=1024) assert(title.x<image.x,`Desktop columns at ${model}/${width}`);
   const buttons=page.locator('[data-mask-maker-cta]');
   for(let index=0;index<await buttons.count();index++){
    const button=buttons.nth(index);await button.scrollIntoViewIfNeeded();
    const box=await button.boundingBox();
    assert(box.x>=-1 && box.x+box.width<=width+1,`Button overflow ${model}/${width}`);
    assert(box.height>=44);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow ${model}/${width}`);
   }
   await buttons.first().tap();
   const payload=await page.evaluate(()=>window.cartPayload);
   assert.equal(payload.includedContents.label,model==='voice'?'8 collagen peptide tablets FREE':'25 g Hydra Gel FREE');
   assert.equal(payload.includedContents.price,0);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:360,height:740}});
  await page.route('**/*',route=>route.fulfill({body:'<svg xmlns="http://www.w3.org/2000/svg"/>',contentType:'image/svg+xml'}));
  await page.setContent('<base href="https://mobile.test/"><div id="root"></div>');
  await page.evaluate(({model})=>{window.testModel=model;window.testProducts=[{id:model,productUrl:model==='voice'?'voice-face-mask-maker':'non-voice-face-mask-maker',name:model==='voice'?'Voice Face Mask Maker':'Non-Voice Face Mask Maker',price:3999,inStock:false,stock:0}];},{model});
  await page.addStyleTag({content:css});await page.addScriptTag({content:bundle.outputFiles[0].text});
  await page.locator('[data-mask-maker-cta]').first().click();
  await page.getByRole('dialog').waitFor();
  assert(await page.getByLabel('Email or mobile number').isVisible());
  assert.equal(await page.evaluate(()=>window.cartPayload),undefined);
  await page.close();
 }
 console.log('PASS: both full landing pages at 320/360/390/430/640/1280px; artwork order and ratio, no overflow, touch-size buttons, correct free gifts at checkout, Notify Me for sold-out products, no runtime errors. Shell and product/API data were mocked.');
}finally{await browser.close();}
