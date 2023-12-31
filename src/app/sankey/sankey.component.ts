import * as d3 from 'd3';
import { 
  sankey as Sankey,
  sankeyLinkHorizontal as SankeyLinkHorizontal,
  SankeyGraph 
} from 'd3-sankey';
import { 
  Component, 
  OnInit, 
  ChangeDetectorRef, 
  Inject 
} from '@angular/core';
import { 
  MatDialog, 
  MAT_DIALOG_DATA, 
  MatDialogRef, 
  MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import SampleJson from '../../assets/france.json';


export interface DialogData {
  animal: string;
  name: string;
}

@Component({
  selector: 'disclaimer-dialog',
  templateUrl: 'disclaimer.html',
  styleUrls: ['./disclaimer.sass'],
  standalone: true,
  imports: [ MatDialogModule, MatButtonModule ]
})
export class DialogOverviewExampleDialog {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent implements OnInit {

  inputs: Array<any> = [];
  colors: any = {};
  constants: any = {};
  definitions: Array<any> = [];
  values: any = {};
  displayOptions = {
    'showValues': true,
    'asPercent': true
  }
  legend?: any;
  
  // D3 Sankey
  private svg: any;
  private margin = 100;
  private resizeObserver?: ResizeObserver;
  private dataSankey: SankeyGraph<any, any> = {nodes: [], links: []};
  private valueCreated: number = 1;

  constructor(
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.inputs = SampleJson.inputs;
    this.colors = SampleJson.colors;
    this.constants = SampleJson.constants;
    this.definitions = SampleJson.definitions;
    this.inputs.forEach((category: any) => {
      category.sections.forEach((section: any) => {
        section.inputs.forEach((input: any) => {
          section.selected = ("optional" in section) ? section.selected : true;
          section.selected = ("selected" in section) ? section.selected : false;
          this.values[input.variable] = section.selected ? input.default : 0;
        });
      });
    });
    this.updateChartData();
    this.openDialog();
  }

  ngAfterViewChecked() {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.updateChartDrawing());
      let body = document.getElementById('body');
      if (body) this.resizeObserver.observe(body);
    }
  }

  openDialog(): void {
    this.dialog.open(DialogOverviewExampleDialog, {
      data: {},
      width: '800px'
    });
  }

  sectionSelectionChange(section: any, selected: boolean) {
    for(let input of section.inputs) {
      this.values[input.variable] = selected ? input.default : 0;
    }
    this.updateChartData();
  }
  
  update(variable: string, value: any) {
    this.values[variable] = parseInt(value);
    this.updateChartData();
  }

  updateChartData() {

    // Prepare Data
    let ref: any = {};
    let rows: Array<any> = [];
    let nodes: Array<string> = [];
    SampleJson.groups.forEach(group => {
      let total: number = 0;
      if (!nodes.includes(group.title)) nodes.push(group.title);
      group.breakdown?.forEach((breakdown: any) => {
        if (!nodes.includes(breakdown.title)) nodes.push(breakdown.title);
        let f = Function('c,v,r', "return "+breakdown.formula);
        let constants = Object.assign(this.constants, group.constants);
        let value = f(constants, this.values, ref);
        let color = breakdown.color ? (breakdown.color[0]=='#' ? breakdown.color : this.colors[breakdown.color]) : '#00000022';
        if ("ref" in breakdown) { ref[breakdown.ref as keyof typeof breakdown] = value; }
        if (value > 0) { 
          if (group.direction == 'forward')  rows.push([group.title, breakdown.title, value, color, f]);
          if (group.direction == 'backward') rows.push([breakdown.title, group.title, value, color, f]);
          total += value;
        }
      });
      if ("ref" in group) ref[group.ref as keyof typeof group] = total;
      if (group.title == 'Valeur Créée') this.valueCreated = total;
    });
    
    // Format Nodes & Links in D3-Sankey format
    let getNodeColor = (title: string) => {
      let color = SampleJson.groups.find((g: any) => g.title==title)?.color;
      return color ? (color[0]=='#' ? color : this.colors[color]) : '#000';
    }
    let getNodeValue = (title: string) => {
      let left = rows.filter((row: any) => row[1]==title);
      let rght = rows.filter((row: any) => row[0]==title);
      let sum = (rows: any[]) => rows.reduce((a: number, c: any) => a+c[2], 0);
      if (left.length && rght.length) {
        if (sum(left)!=sum(rght)) console.log('WARNING: Left & Right values mismatch for block "'+title+'" (left='+sum(left)+"/right="+sum(rght)+')');
        return sum(left);
      }
      if (left.length) return sum(left);
      if (rght.length) return sum(rght);
      return 0;
    };
    this.dataSankey.nodes = nodes.map((title: any) => ({name: title, color: getNodeColor(title), total: getNodeValue(title)}));
    let i = (title: string) => this.dataSankey.nodes.findIndex((o: any) => o.name == title);
    this.dataSankey.links = rows.map((o: any) => ({ source: i(o[0]), target: i(o[1]), value: o[2], color: o[3], formula:  o[4]}));

    // Redraw the chart
    this.updateChartDrawing();

  }
    
  updateChartDrawing() {
    
    // Get the container size
    var container = document.getElementById('container');
    if (!container) return;
    var width = container.clientWidth - (this.margin * 2);
    var height = container.clientHeight - (this.margin * 2) - 20;
    if (width < 0 || height < 0) return;
    
    // Update the chart
    d3.select("#container").html("")
    this.svg = d3.select("#container")
      .append("svg")
      .attr("width", width + (this.margin * 2))
      .attr("height", height + (this.margin * 2))
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");
    let sankey = Sankey()
      .nodeWidth(10)
      .nodePadding(20)
      .size([width, height]);
    sankey(this.dataSankey);
    
    // Links
    let getDefinition = (title: string) => this.definitions.find(o => o.title == title)?.definition;
    this.svg.selectAll('.link')
      .data(this.dataSankey.links, (d: any) => d.name)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', SankeyLinkHorizontal())
      .style('stroke-width', (d: any) => Math.max(1, d.width))
      .style('stroke', (d: any) => d.color)
      .style('fill', 'none')
      .on("mouseover", (e: any, d: any) => {
        this.legend = {
          'source': {
            'title': d.source.name,
            'definition': getDefinition(d.source.name)
          },
          'target': {
            'title': d.target.name,
            'definition': getDefinition(d.target.name)
          },
          'formula': undefined,
          'comment': undefined
        };
        this.cdRef.detectChanges();
      })
      .on("mouseout", () => {
        this.legend = undefined;
        this.cdRef.detectChanges();
      });

    // Nodes
    let n = this.svg
      .selectAll(".node")
      .data(this.dataSankey.nodes, (d: any) => d.name)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => "translate(" + d.x0 + "," + d.y0 + ")");

    // Nodes - Rectangles
    n.append("rect")
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .style("fill", (d: any) => d.color);
    
    // Nodes - Labels
    let th = 30;
    let dy = (d: any) => (d.y1 - d.y0);
    let val = (d: any, p?: boolean) => {
      let ret = ''
      if (!this.displayOptions.showValues) return '';
      if (!d.total) ret = '-';
      if (this.displayOptions.asPercent) ret = (Math.round(10 * 100 * d.total / this.valueCreated)/10) + '%';
      if (!this.displayOptions.asPercent) ret = Math.round(d.total).toLocaleString();
      return (p?' (':'') + ret + (p?')':'')
    };
    let labelText = n.append("text")
      .attr("x", -6)
      .attr("y", (d: any) => dy(d) / 2)
      .attr("dy", (d: any) => (this.displayOptions.showValues && (dy(d) > th)) ? "-0.35em" : "0.35em")
      .attr("text-anchor", "end")
      .text((d: any) => (this.displayOptions.showValues && (dy(d) > th)) ? '' : d.name+''+val(d, true));
    labelText.append("tspan")
      .attr("x", -6)
      .text((d: any) => dy(d) > th ? d.name : '');
    labelText.append("tspan")
      .attr("x", -6)
      .attr("dy", "1.3em")
      .text((d: any) => dy(d) > th ? val(d): '');

  }

}
