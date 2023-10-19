import * as d3 from 'd3';
import { 
  sankey as Sankey,
  sankeyLinkHorizontal as SankeyLinkHorizontal,
  SankeyGraph 
} from 'd3-sankey';
import { Component, OnInit } from '@angular/core';
import SampleJson from '../../assets/france.json';

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent implements OnInit {

  inputs: Array<any> = [];
  colors: any = {};
  constants: any = {};
  values: any = {};
  
  // D3 Sankey
  private svg: any;
  private margin = 100;
  private observer?: ResizeObserver;
  private dataSankey: SankeyGraph<any, any> = {nodes: [], links: []};

  ngOnInit() {
    this.inputs = SampleJson.inputs;
    this.colors = SampleJson.colors;
    this.constants = SampleJson.constants;
    this.inputs.forEach(o => this.values[o.variable] = o.default);
    this.updateChartData();
  }

  ngAfterViewChecked() {
    if (!this.observer) {
      this.observer = new ResizeObserver(entries => {
        this.updateChartDrawing();
      });
      let container = document.getElementById('container');
      if (container) this.observer.observe(container);
    }
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
    let totals: any = {};
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
          if (group.direction == 'forward')  rows.push([group.title, breakdown.title, value, color]);
          if (group.direction == 'backward') rows.push([breakdown.title, group.title, value, color]);
          total += value;
        }
      });
      totals[group.title] = total;
      if ("ref" in group) ref[group.ref as keyof typeof group] = total;
    });
    
    // Format Nodes & Links in D3-Sankey format
    let getNodeColor = (title: string) => {
      let color = SampleJson.groups.find((g: any) => g.title==title)?.color;
      return color ? (color[0]=='#' ? color : this.colors[color]) : '#000';
    }
    let getNodeValue = (title: string) => {
      return totals[title];
    };
    this.dataSankey.nodes = nodes.map((title: any) => ({name: title, color: getNodeColor(title), total: getNodeValue(title)}));
    let i = (title: string) => this.dataSankey.nodes.findIndex((o: any) => o.name == title);
    this.dataSankey.links = rows.map((o: any) => ({ source: i(o[0]), target: i(o[1]), value: o[2], color: o[3] }));

    // Redraw the chart
    this.updateChartDrawing();

  }
    
  updateChartDrawing() {
    
    // Get the container size
    var container = document.getElementById('container');
    if (!container) return;
    var width = container.clientWidth - (this.margin * 2);
    var height = container.clientHeight - (this.margin * 2);
    console.log('width', width, height);
    if (width < 0 || height < 0) return;
    console.log('width', width, height);
    
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
    this.svg.selectAll('.link')
      .data(this.dataSankey.links, (d: any) => d.name)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', SankeyLinkHorizontal())
      .style('stroke-width', (d: any) => Math.max(1, d.width))
      .style('stroke', (d: any) => d.color)
      .style('fill', 'none');

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
    
    // Nodes - Label
    n.append("text")
      .attr("x", -6)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text((d: any) => d.name + '('+Math.round(d.total)+')');
    
  }

}
