import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import Footer from "@/components/footer";
import { BLOG_POSTS } from "../data";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Promise<Metadata> => {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p: any) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — Velamini Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} — Velamini Blog`,
      description: post.excerpt,
      url: `https://velamini.com/blog/${post.slug}`,
      siteName: "Velamini",
      images: [
        {
          url: "https://velamini.com/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title
        }
      ],
      locale: "en_US",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Velamini Blog`,
      description: post.excerpt,
      images: ["https://velamini.com/velamini.png"],
    }
  };
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p: any) => p.slug === slug);
  if (!post) return notFound();

  return (
    <>
      <style>{`
        .article-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 5rem;
          color: var(--fg);
        }
        [data-mode="dark"] .article-wrap { color: var(--fg); }
        [data-mode="light"] .article-wrap { color: var(--fg); }

        .article-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--ac);
          text-decoration: none;
          margin-bottom: 1.75rem;
        }
        .article-back:hover { text-decoration: underline; }

        .article-header { margin-bottom: 2.5rem; }
        .article-cat {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--ac);
          margin-bottom: 0.75rem;
        }
        .article-title {
          font-size: clamp(2rem, 4.5vw, 3rem);
          margin: 0.25rem 0 1rem;
          line-height: 1.1;
        }
        .article-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: var(--mu);
          margin-bottom: 1.5rem;
        }
        .article-dot {
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 50%;
          background: currentColor;
          display: inline-block;
          margin: 0.6rem 0;
        }
        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .article-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(56, 174, 204, 0.12);
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          font-size: 0.85rem;
          color: var(--ac);
        }
        .article-content {
          line-height: 1.75;
          font-size: 1rem;
        }
        .article-content h2 {
          margin-top: 2.2rem;
          margin-bottom: 1rem;
          font-size: clamp(1.5rem, 3vw, 2rem);
        }
        .article-content h3 {
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .article-content p {
          margin: 1.2rem 0;
        }
        .article-content ul,
        .article-content ol {
          margin: 1.25rem 0 1.25rem 1.4rem;
        }
        .article-content li {
          margin: 0.5rem 0;
        }
        .article-content pre {
          background: rgba(0,0,0,0.08);
          padding: 1rem;
          border-radius: 12px;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.92rem;
        }
        .article-content code {
          background: rgba(0,0,0,0.1);
          padding: 0.15rem 0.35rem;
          border-radius: 6px;
          font-size: 0.95rem;
        }
      `}</style>

      <div className="article-wrap">
        <Link href="/blog" className="article-back">
          <ArrowLeft size={16}/> Back to Blog
        </Link>
        <div className="article-header">
          <span className="article-cat" style={{ color: post.accentColor }}>{post.category}</span>
          <h1 className="article-title">{post.title}</h1>
          <div className="article-meta">
            <span>{post.date}</span>
            <span className="article-dot" />
            <Clock size={12}/>
            <span>{post.readTime}</span>
          </div>
          <div className="article-tags">
            {post.tags.map((tag: string) => (
              <span key={tag} className="article-tag"><Tag size={10}/> {tag}</span>
            ))}
          </div>
        </div>
        <div className="article-content">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>
      <Footer />
    </>
  );
}
