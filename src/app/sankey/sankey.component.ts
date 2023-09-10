import { ChartType } from 'angular-google-charts';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent {

  columns = ['From', 'To', 'Weight'];
  type: ChartType = ChartType.Sankey;
  options = {
    'height': 700, 
    'width': 1000
  };
  data = [
    [ 'Value', 'Cotisation Patronales', 9581 ],
    [ 'Value', 'Cotisation Salariales', 6689 ],
    [ 'Value', 'Impot sur le revenue', 1339 ],
    [ 'Value', 'Net', 22805 ],
    [ 'Net', 'Depenses', 20525],
    [ 'Net', 'Epargne', 2280],
    [ 'Cotisation Patronales', 'Taxes', 9581 ],
    [ 'Cotisation Salariales', 'Taxes', 6689 ],
    [ 'Impot sur le revenue', 'Taxes', 1339 ],
 ];

}
