import { ChartType, ScriptLoaderService, getPackageForChart } from 'angular-google-charts';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import SampleJson from '../../assets/median.json';

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
  // data = [
  //   // [ 'Value', 'Cotisation Patronales', 9581 ],
  //   // [ 'Value', 'Cotisation Salariales', 6689 ],
  //   // [ 'Value', 'Impot sur le revenu', 1339 ],
  //   [ 'Value', 'Net', 22805 ],
  //   [ 'Net', 'Epargne', 2280],
  //   [ 'Net', 'Depenses', 20525],
  //   [ 'Cotisation Patronales', 'Taxes', 9581 ],
  //   [ 'Cotisation Salariales', 'Taxes', 6689 ],
  //   [ 'Impot sur le revenu', 'Taxes', 1339 ],
  // ];
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

  income: number = 80000;
  
  constructor(private loaderService: ScriptLoaderService) {}

  ngOnInit() {

    // Helpers
    let unique = (arr: Array<any>) => arr.filter((o,i)=>arr.indexOf(o)===i);

    // Prepare Data
    let net = this.income;
    let rows: Array<any> = [];
    
    SampleJson.organizations.forEach(organization => {
      let variables = organization.variables;
      let categories = unique(organization.deductions.map(o=>o.category));
      categories.forEach(category => {
        
        // Tax calculation based on external bases
        let category_total = 0;
        organization.deductions.filter(o => o.category==category && o.base!=category).forEach(deduction => {
          let base = deduction.base == 'total' ? this.income : variables[deduction.base as keyof typeof variables];
          let value = Math.round(base! * deduction.rate / 100);
          if (value > 0) {
            rows.push(['Cout Employeur', deduction.title, value]);
            rows.push([deduction.title, category, value]);
          }
          category_total += value;
          if (deduction.deduced) net -= value; 
        });

        // Tax depending on the total of the category
        organization.deductions.filter(o => o.category==category && o.base==category).forEach(deduction => {
          let base = category_total;
          let value = Math.round(base * deduction.rate / 100);
          if (value > 0) {
            rows.push(['Cout Employeur', deduction.title, value]);
            rows.push([deduction.title, category, value]);
          }
          category_total += value;
          if (deduction.deduced) net -= value; 
        });

      });
    });
    rows.push(['Cout Employeur', 'Net', net]);

    this.loaderService.loadChartPackages(this.chartPackage).subscribe(() => {

      let data = new google.visualization.DataTable();
      data.addColumn('string', 'From');
      data.addColumn('string', 'To'); 
      data.addColumn('number', 'Weight');
      data.addRows(rows);

      // Setting the colors
      // let labels = this.data?.map(o => [o[0], o[1]]).flat();
      // let uniques = unique(labels); //.filter((o,i) => labels.indexOf(o)===i);
      // this.options.sankey.node.colors = uniques.map(o => (o in this.colorMap) ? this.colorMap[o] : '#000');
      
      // Creating the chart
      const chart = new google.visualization.Sankey(this.container.nativeElement);
      
      // data.addRows(this.data);
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
