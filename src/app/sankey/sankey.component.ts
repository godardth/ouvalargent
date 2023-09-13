import { ChartType, ScriptLoaderService, getPackageForChart } from 'angular-google-charts';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import SampleJson from '../../assets/france.json';

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent implements OnInit {
  
  @ViewChild('container') private container!: ElementRef<HTMLElement>;
  
  private readonly chartPackage = getPackageForChart(ChartType.Sankey);

  options = {
    'id': 'sankey_chart',
    'height': 700, 
    'width': 1000,
    'sankey': {
      'node': { 
        'width': 15,
        'nodePadding': 30,
        'colors': ['#000'],
        'label': { 
          'fontName': 'Arial',
          'fontSize': 14,
          'color': '#000',
          'bold': false,
          'italic': false
        } 
      },
      'link': { 
        'color': { 
          'fill': '#DDD',
          'fillOpacity': 0.5 
        } 
      },
    }
  };
  colorMap: any = {
    'Value': '#2196f3',
    'Net': '#8feeaa',
    'Cotisation Patronales': '#ffc249',
    'Cotisation Salariales': '#f4f453',
    'Impot sur le revenu': '#f44336',
    'Depenses': '#8feeaa',
    'Taxes': '#f44336',
    'Epargne': '#2196f3'
  };

  // income: number = 80000;
  inputs: Array<any> = [];
  values: any = {};

  constructor(private loaderService: ScriptLoaderService) {}

  ngOnInit() {
    this.loaderService.loadChartPackages(this.chartPackage).subscribe(() => {
      this.redrawChart();
    });
  }

  redrawChart() {

    // Helpers
    let unique = (arr: Array<any>) => arr.filter((o,i)=>arr.indexOf(o)===i);

    // Prepare Data
    let ref: any = {};
    let rows: Array<any> = [];
    this.inputs = SampleJson.inputs;
    this.inputs.forEach(o => this.values[o.variable] = o.default);
    SampleJson.groups.forEach(group => {
      let total: number = 0;
      group.breakdown?.forEach(breakdown => {
        let f = Function('c,v,r', "return "+breakdown.formula);
        let value = f(group.constants, this.values, ref);
        if ("ref" in breakdown) { ref[breakdown.ref as keyof typeof breakdown] = value; }
        if (value > 0) { 
          if (group.direction == 'forward')  rows.push([group.title, breakdown.title, value]);
          if (group.direction == 'backward') rows.push([breakdown.title, group.title, value]);
          total += value;
        }
      });
      if ("ref" in group) ref[group.ref as keyof typeof group] = total;
    });

    let data = new google.visualization.DataTable();
    data.addColumn('string', 'From');
    data.addColumn('string', 'To'); 
    data.addColumn('number', 'Weight');
    data.addRows(rows);

    // Setting the colors
    let colorMap = SampleJson.groups
      .map(o=>o.breakdown.concat([{ 'title': o.title, 'color': <string>(("color" in o) ? o['color' as keyof typeof o] : '#000'), ref: '', formula: '' }]))
      .flat()
      .map(o=>({ 't': o.title, 'c': ("color" in o) ? o['color' as keyof typeof o] : undefined }));
    let labels = unique(rows?.map(o => [o[0], o[1]]).flat());
    console.log(colorMap);
    this.options.sankey.node.colors = <string[]>labels.map(o => {
      let color = colorMap.find(x=>x.t==o);
      return color?.c ? color.c : '#000';
    });

    // Drawing the chart
    let chart = new google.visualization.Sankey(this.container.nativeElement);
    chart.draw(data, this.options);

  }
 
}
