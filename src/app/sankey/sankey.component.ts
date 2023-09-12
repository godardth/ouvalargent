import { ChartType, ScriptLoaderService, getPackageForChart } from 'angular-google-charts';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

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
        'nodePadding': 40,
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
  data = [
    [ 'Value', 'Cotisation Patronales', 9581 ],
    [ 'Value', 'Cotisation Salariales', 6689 ],
    [ 'Value', 'Impot sur le revenu', 1339 ],
    [ 'Value', 'Net', 22805 ],
    [ 'Net', 'Epargne', 2280],
    [ 'Net', 'Depenses', 20525],
    [ 'Cotisation Patronales', 'Taxes', 9581 ],
    [ 'Cotisation Salariales', 'Taxes', 6689 ],
    [ 'Impot sur le revenu', 'Taxes', 1339 ],
  ];
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
  
  constructor(private loaderService: ScriptLoaderService) {}
  
  get_data_table() {
    let table = new google.visualization.DataTable();
    table.addColumn('string', 'From');
    table.addColumn('string', 'To'); 
    table.addColumn('number', 'Weight');
    table.addRows(this.data);
    return table;
  }

  ngOnInit() {
    this.loaderService.loadChartPackages(this.chartPackage).subscribe(() => {
      
      // Setting the colors
      let labels = this.data?.map(o => [o[0], o[1]]).flat();
      let uniques = labels.filter((o,i) => labels.indexOf(o)===i);
      this.options.sankey.node.colors = uniques.map(o => (o in this.colorMap) ? this.colorMap[o] : '#000');
      
      // Creating the chart
      const chart = new google.visualization.Sankey(this.container.nativeElement);
      let data = new google.visualization.DataTable();
      data.addColumn('string', 'From');
      data.addColumn('string', 'To'); 
      data.addColumn('number', 'Weight');
      data.addRows(this.data);
      chart.draw(data, this.options);
      
    });
  }

  // onReady(event: any) {
  //   var observer = new MutationObserver((mutations: any) => {
  //     mutations.forEach((mutation: any) => {
  //       mutation.addedNodes.forEach((node: any, index: number) => {
  //         let label = index;
  //         if (node.tagName === 'text' && node.innerHTML in this.colorMap)
  //           node.setAttribute('fill', this.colorMap[node.innerHTML]);
  //       });
  //     });
  //   });
  //   observer.observe(event.chart.container, {
  //     childList: true,
  //     subtree: true
  //   });
  // }
 
 
}
