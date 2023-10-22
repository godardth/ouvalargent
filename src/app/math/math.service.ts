import { Injectable } from "@angular/core";
import { Subject, ReplaySubject, Observable } from "rxjs";

interface MathJaxConfig {
  source: string;
  integrity: string;
  id: string;
}

declare global {
  interface Window {
    MathJax: {
        mathjax(): () => Promise<void>;
      typeset(): () => void;
      typesetPromise: () => Promise<void>;
      startup: {
        promise: Promise<any>;
      };
    };
  }
}

@Injectable({
  providedIn: "root"
})
export class MathService {
  private signal: Subject<boolean> = new ReplaySubject<boolean>();
  private mathJax: MathJaxConfig = {
    source: "https://cdn.jsdelivr.net/npm/mathjax@3.0.5/es5/mml-chtml.js",
    integrity: "sha256-CnzfCXjFj1REmPHgWvm/OQv8gFaxwbLKUi41yCU7N2s=",
    id: "MathJaxScript"
  };
  private mathJaxFallback: MathJaxConfig = {
    source: "assets/mathjax/mml-chtml.js",
    integrity: "sha256-CnzfCXjFj1REmPHgWvm/OQv8gFaxwbLKUi41yCU7N2s=",
    id: "MathJaxBackupScript"
  };
  
  constructor() {
    void this.registerMathJaxAsync(this.mathJax)
      .then(() => this.signal.next(true))
      .catch(error => {
         void this.registerMathJaxAsync(this.mathJaxFallback)
          .then(() => this.signal.next(true))
          .catch((error) => console.log(error));
      });
  }

  private async registerMathJaxAsync(config: MathJaxConfig): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      const script: HTMLScriptElement = document.createElement("script");
      script.id = config.id;
      script.type = "text/javascript";
      script.src = config.source;
      script.integrity = config.integrity;
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => {console.log('script.onload'); resolve(); };
      script.onerror = error => reject(error);
      document.head.appendChild(script);
    });
  }

  ready(): Observable<boolean> {
    return this.signal;
  }

  render(element: HTMLElement, math: string) {
    // Take initial typesetting which MathJax performs into account
    window.MathJax.startup.promise.then(() => {
      element.innerHTML = math;
      console.log('render - after', element.innerHTML);
      setTimeout( () => { window.MathJax.typeset() }, 500 );
      console.log(window.MathJax.typeset, window.MathJax.typesetPromise)
      window.MathJax.typesetPromise().then(() => {
        console.log('Math typesetting complete');
      });
    });
  }
}
