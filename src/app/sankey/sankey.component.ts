import * as d3 from 'd3';
import { 
  sankey as Sankey,
  sankeyLinkHorizontal as SankeyLinkHorizontal,
  SankeyGraph 
} from 'd3-sankey';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogOverviewExampleDialog } from '../disclaimer/disclaimer.component';


@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent implements OnInit {

  data?: any;
  percent_base: number = 1;
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

  constructor(
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      let file = params['json'] ? params['json'] : 'france_tax';
      import(`../../assets/${file}.json`)
        .then(data => {
          this.data = data;
          this.data.inputs.forEach((category: any) => {
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
        })
        .catch(err => console.log(err));
    });
  }

  ngAfterViewChecked() {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.updateChartDrawing());
      let body = document.getElementById('body');
      if (body) this.resizeObserver.observe(body);
    }
  }

  openDialog(): void {
    this.dialog.open(DialogOverviewExampleDialog, { data: this.data, width: '800px' });
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
    if (!this.data) return;

    // References Management
    let definitions = this.data.definitions;
    let references = definitions.reduce((res: any, val: any) => { 
      if (val.ref) res[val.ref] = {'value': 0, 'read': false}; 
      return res}
    , {});
    let getRefValue = function(references: any, definitions: any, title: string) {
      let ref_name = definitions.find((d: any) => d.title == title)?.ref;
      return references[ref_name]?.value;
    }
    let setRefValue = function(references: any, definitions: any, title: string, value: number) {
      let old = getRefValue(references, definitions, title);
      console.log(`INFO: Updating ${title} to ${value} (was ${old})`);
      if (value == old) return console.log(`INFO: Reference value not updated for ${title}`);
      let ref_name = definitions.find((d: any) => d.title == title)?.ref;
      if (!ref_name) return console.log(`WARNING: Reference name not found in the definitions section for ${title}`);
      if (!references[ref_name]) return console.log(`WARNING: Reference ${ref_name} not found and not updated`);
      if (references[ref_name].read) console.log(`WARNING: Reference ${ref_name} value is updated after it has been read`);
      references[ref_name].value = value;
    }
    let updateReadRef = function(references: any, formula: string) {
      let refs = formula.match(/r['[a-zA-Z_-]*']/g)?.map(m => m.slice(3, -2));
      if (!refs) return;
      for (let ref of refs) 
        if (references[ref])
          references[ref].read = true;
    }

    // Prepare Data
    let rows: Array<any> = [];
    let nodes: Array<string> = [];
    this.data.groups.forEach((group: any) => {
      let total: number = 0;
      if (!nodes.includes(group.title)) nodes.push(group.title);
      group.breakdown?.forEach((breakdown: any) => {
        if (!nodes.includes(breakdown.title)) nodes.push(breakdown.title);
        updateReadRef(references, breakdown.formula);
        let f = Function('c,v,r', "return "+breakdown.formula);
        let constants = Object.assign(this.data.constants, group.constants);
        let value = Math.round(f(constants, this.values, Object.keys(references).reduce((a: any, k: any) => { a[k] = references[k].value; return a; }, {})));
        let color = breakdown.color ? (breakdown.color[0]=='#' ? breakdown.color : this.data.colors[breakdown.color]) : '#00000022';
        // References
        if (Object.keys(references).includes(breakdown.ref)) console.log('Warning: subref is equal to main ref !!!');
        if ("ref" in breakdown) { references[breakdown.ref as keyof typeof breakdown] = {'value': value, 'read': false}; }
        if (value > 0) { 
          if (!breakdown.formula.includes(`r['${definitions.find((d: any) => d.title == breakdown.title)?.ref}']`))
            setRefValue(references, definitions, breakdown.title, getRefValue(references, definitions, breakdown.title) + value);
          if (group.direction == 'forward')  rows.push([group.title, breakdown.title, value, color, f]);
          if (group.direction == 'backward') rows.push([breakdown.title, group.title, value, color, f]);
          total += value;
        }
      });
      // Overwrite the reference value if value is the total of a group
      let def = this.data.definitions.find((o: any) => o.title == group.title);
      if (def?.ref) setRefValue(references, definitions, def.title, total);
      if (def?.percent_base) this.percent_base = total;
    });
    
    // Format Nodes & Links in D3-Sankey format
    let getNodeColor = (title: string) => {
      let color = this.data.definitions.find((g: any) => g.title==title)?.color;
      return color ? (color[0]=='#' ? color : this.data.colors[color]) : '#000';
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
    let getDefinition = (title: string) => this.data.definitions.find((o: any) => o.title == title)?.definition;
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
      if (this.displayOptions.asPercent) ret = (Math.round(10 * 100 * d.total / this.percent_base)/10) + '%';
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
