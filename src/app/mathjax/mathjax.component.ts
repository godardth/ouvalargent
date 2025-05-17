import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MathJaxService } from './mathjax.service';

@Component({
  selector: 'mathjax',
  template: '<p #mathParagraph></p>'
})
export class MathJaxComponent implements OnChanges {
  
  @ViewChild('mathParagraph') paragraphElement: any;
  @Input({ required: true }) formula!: string;

  constructor(private mathJaxService: MathJaxService) {}

  ngOnChanges() {
    this.mathJaxService.getMathJaxLoadedPromise().then(() => {
      console.log('ngOnChanges - Rendering MathJax');
      this.paragraphElement.nativeElement.innerHTML = this.formula;
      this.mathJaxService.render(this.paragraphElement.nativeElement);
    });
  }

}