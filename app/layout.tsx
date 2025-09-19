import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { TRPCReactProvider } from '@/trpc/react';
import { GlobalErrorHandler } from '@/components/global-error-handler';

export const metadata: Metadata = {
  metadataBase: new URL('https://sparka.ai'),
  title: 'Sparka AI - AI for everyone, from everyone',
  description:
    'Multi-provider AI Chat - access Claude, ChatGPT, Gemini, and Grok with advanced features, open-source and production-ready.',
  openGraph: {
    siteName: 'Sparka AI',
    url: 'https://sparka.ai',
    title: 'Sparka AI - AI for everyone, from everyone',
    description:
      'Multi-provider AI Chat - access Claude, ChatGPT, Gemini, and Grok with advanced features, open-source and production-ready.',
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
  interactiveWidget: 'resizes-content' as const,
};

// Temporarily disabled due to Turbopack font loading issues
// const geist = Geist({
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-geist',
// });

// const geistMono = Geist_Mono({
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-geist-mono',
// });

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className=""
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
        {process.env.NODE_ENV !== 'production' ? (
          <>
            <Script
              src="https://unpkg.com/react-scan/dist/auto.global.js"
              strategy="beforeInteractive"
            />
            <Script id="browser-echo" strategy="beforeInteractive">
              {`
(function(){
  if (typeof window==='undefined') return;
  if (window.__browser_echo_installed__) return;
  window.__browser_echo_installed__ = true;
  var ROUTE="/api/client-logs", INCLUDE=["warn","error"], PRESERVE=true, TAG="[sparka-ai]";
  var STACK_MODE="condensed", SHOW_SOURCE=true;
  var BATCH_SIZE=10, BATCH_INTERVAL=1000;
  var SESSION=(function(){try{var a=new Uint8Array(8);crypto.getRandomValues(a);return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('')}catch{return String(Math.random()).slice(2,10)}})();
  var q=[],t=null;
  function enqueue(e){q.push(e); if(q.length>=BATCH_SIZE){flush()} else if(!t){t=setTimeout(flush,BATCH_INTERVAL)}}
  function flush(){ if(t){clearTimeout(t); t=null} if(!q.length) return;
    var p=JSON.stringify({sessionId:SESSION,entries:q.splice(0,q.length)});
    try{ if(navigator.sendBeacon) navigator.sendBeacon(ROUTE,new Blob([p],{type:'application/json'}));
      else fetch(ROUTE,{method:'POST',headers:{'content-type':'application/json'},body:p,keepalive:true,cache:'no-store'}).catch(()=>{}); }catch(_){}
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden') flush()});
  addEventListener('pagehide', flush); addEventListener('beforeunload', flush);
  function safeFormat(v){ if(typeof v==='string') return v; if(v && v instanceof Error) return (v.name||'Error')+': '+(v.message||'');
    try{var seen=new WeakSet(); return JSON.stringify(v,(k,val)=>{ if(typeof val==='bigint') return String(val)+'n';
      if(typeof val==='function') return '[Function '+(val.name||'anonymous')+']';
      if(val && val instanceof Error) return {name:val.name,message:val.message,stack:val.stack};
      if(typeof val==='symbol') return val.toString();
      if(val && typeof val==='object'){ if(seen.has(val)) return '[Circular]'; seen.add(val) } return val; }); }
    catch(e){ try{return String(v)}catch{return '[Unserializable]'} } }
  function captureStack(){
    if(STACK_MODE === 'none') return '';
    try{
      var e=new Error(), raw=e.stack||'', lines=raw.split('\\n').slice(1);
      var filtered = lines.filter(l=>!/browser-echo|captureStack|safeFormat|enqueue|flush/.test(l));
      if(STACK_MODE === 'condensed') {
        return filtered.slice(0, 1).join('\\n');
      }
      return filtered.join('\\n');
    }catch{return ''}
  }
  function parseSource(stack){ if(!stack) return ''; var m=stack.match(/\\(?((?:file:\\/\\/|https?:\\/\\/|\\/)[^) \\n]+):(\\d+):(\\d+)\\)?/); return m? (m[1]+':'+m[2]+':'+m[3]) : '' }
  var ORIGINAL={}; for (var i=0;i<INCLUDE.length;i++){ (function(level){
    var orig=console[level]?console[level].bind(console):console.log.bind(console); ORIGINAL[level]=orig;
    console[level]=function(){ var args=[...arguments]; var text=args.map(safeFormat).join(' ');
      var stack=captureStack(); var source=SHOW_SOURCE ? parseSource(stack) : '';
      enqueue({level:level,text:text,time:Date.now(),stack:stack,source:source});
      if(PRESERVE){ try{ orig.apply(console,args) }catch(e){} } }
  })(INCLUDE[i]) }
  try{ ORIGINAL['info'] && ORIGINAL['info'](TAG+' forwarding console logs to '+ROUTE+' (session '+SESSION+')') }catch(_){}
})();
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body className="antialiased">
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
        <GlobalErrorHandler>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </GlobalErrorHandler>
        <Analytics />
      </body>
    </html>
  );
}
