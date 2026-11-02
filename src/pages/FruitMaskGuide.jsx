import React from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import OptimizedImage from "../components/OptimizedImage";
import StructuredData from "../components/StructuredData";
import MaskMakerVariantCards from "../components/MaskMakerVariantCards";
import { useSeo } from "../hooks/useSeo";
import { FRUIT_MASK_BLOG as blog, FRUIT_MASK_FAQS } from "../data/fruitMaskBlog.js";
import "./FruitMaskGuide.css";

const PAGE_PATH = `/blog/${blog.slug}`;

export default function FruitMaskGuide() {
  useSeo({ title: blog.metaTitle, description: blog.metaDescription, path: PAGE_PATH, canonical: PAGE_PATH, image: `https://ilika.in${blog.image}`, robots: "index, follow", type: "article" });
  return <div className="fruit-mask-guide">
    <Header forceWhiteBg />
    <StructuredData schema={[
      { "@context": "https://schema.org", "@type": "Article", headline: blog.title, description: blog.metaDescription, mainEntityOfPage: `https://ilika.in${PAGE_PATH}`, image: [`https://ilika.in${blog.image}`], datePublished: blog.createdAt, author: { "@type": "Organization", name: blog.author } },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FRUIT_MASK_FAQS.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ]} />
    <main><article>
      <header className="fruit-guide-heading"><nav aria-label="Blog breadcrumb"><Link to="/blog">Ilika Journal</Link><span>/</span><span>DIY skincare</span></nav><p className="fruit-guide-kicker"><Sparkles size={15} /> FRESH IDEAS FOR YOUR SELF-CARE RITUAL</p><h1><span>Stop buying sheet masks every time.</span><em>Make it fresh with Ilika Mask Maker.</em></h1><p className="fruit-guide-intro">Turn your favourite fruits into a fresh masking ritual. Choose your Ilika Mask Maker and discover your Diwali extras.</p><div className="fruit-guide-author">By {blog.author}<span aria-hidden="true">&middot;</span><time dateTime={blog.createdAt}>2 November 2026</time></div><a className="fruit-guide-jump" href="#two-mask-maker-variants">Compare the two models & Diwali offers <ArrowDown size={16} /></a></header>
      <figure className="fruit-guide-hero"><OptimizedImage priority data-guide-image="spa" src={blog.image} alt={blog.imageAlt} width={1672} height={941} sizes="(max-width: 1023px) 100vw, 1100px" /><figcaption>Fresh fruit, a mask you made yourself and a few calm minutes.</figcaption></figure>
      <div className="fruit-guide-article-body">
        {blog.contentSections.map((section) => {
          if (section.type === "faq") return <section className="fruit-guide-faq" id={section.id} key={section.id} aria-labelledby="fruit-guide-faq-title"><p className="fruit-guide-kicker">LITTLE DETAILS WORTH KNOWING</p><h2 id="fruit-guide-faq-title">Your questions, <em>answered.</em></h2>{FRUIT_MASK_FAQS.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</section>;
          if (section.type === "mask-maker-variants") return <section className="fruit-guide-models" id={section.id} key={section.id} aria-labelledby="fruit-guide-models-title"><p className="fruit-guide-kicker"><Sparkles size={14} /> CHOOSE YOUR LITTLE RITUAL</p><h2 id="fruit-guide-models-title">Available in <em>two variants.</em></h2><p>Voice-guided or without spoken prompts — choose the model that fits your routine. Each card takes you to that model’s own product page and current offer.</p><MaskMakerVariantCards /></section>;
          const content = <div className="fruit-guide-copy" dangerouslySetInnerHTML={{ __html: section.content }} />;
          const picture = section.image && <figure><OptimizedImage data-guide-image={section.id} src={section.image} alt={section.imageAlt} width={section.width} height={section.height} sizes="(max-width: 1023px) 95vw, 1000px" /><figcaption>{section.imageAlt}</figcaption></figure>;
          return <section className={`fruit-guide-section ${section.id === "fruits-to-try" ? "fruit-guide-fruits" : ""}`} id={section.id} key={section.id}>
            {section.title && <h2>{section.title}</h2>}
            {content}
            {section.id === "ready-for-a-fresh-routine" ? <a href="#two-mask-maker-variants" className="fruit-guide-ad-link" aria-label="Choose an Ilika Mask Maker and see its offer">{picture}</a> : picture}
          </section>;
        })}
        <div className="fruit-guide-final"><span><Sparkles size={20} /> A fresh routine starts with your choice.</span><a href="#two-mask-maker-variants">Compare Ilika Mask Maker models <ArrowRight size={17} /></a></div>
      </div>
    </article></main>
    <Footer /><CartDrawer />
  </div>;
}
