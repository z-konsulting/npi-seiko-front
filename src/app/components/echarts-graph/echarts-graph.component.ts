import { Component, effect, input } from "@angular/core";
import { NgxEchartsDirective } from "ngx-echarts";
import { SeriesOption } from "echarts/types/dist/echarts";
import { EChartsOption } from "echarts";
import { ECharts } from "echarts/core";
import { Graph, GraphWhisker } from "../../../client/costSeiko";
import {
  ALL_INDICATORS_COLORS,
  ALL_INDICATORS_COLORS_BOXPLOT_FILLING,
  ALL_INDICATORS_COLORS_SOFT,
  INDICATOR_RED_COLOR,
} from "../../models/globalVariables";

export enum ChartType {
  BAR = "bar",
  WHISKER = "whisker",
  STACK_BAR = "stack_bar",
}

@Component({
  selector: "app-echarts-graph",
  imports: [NgxEchartsDirective],
  templateUrl: "./echarts-graph.component.html",
  styleUrl: "./echarts-graph.component.scss",
})
export class EchartsGraphComponent {
  chartType = input<ChartType>(ChartType.BAR);
  graph = input<Graph | null>();
  graphWhisker = input<GraphWhisker | null>();
  chartOptions!: EChartsOption;
  echartsInstance!: ECharts;

  constructor() {
    effect(() => {
      const graph = this.graph();
      const whisker = this.graphWhisker();
      if (
        graph &&
        (this.chartType() === ChartType.BAR ||
          this.chartType() === ChartType.STACK_BAR)
      ) {
        this.setGraphOptions(graph);
      }
      if (whisker && this.chartType() === ChartType.WHISKER) {
        this.setGraphWhiskerOptions(whisker);
      }
    });
  }

  onChartInit(ec: any) {
    this.echartsInstance = ec;
  }

  setGraphOptions(indicators: Graph) {
    this.setGraphChartOptions(indicators);
  }

  setGraphWhiskerOptions(indicators: GraphWhisker) {
    this.setWhiskerChartOptions(indicators);
  }

  private setWhiskerChartOptions(graph: GraphWhisker) {
    if (!graph.xAxis) {
      this.chartOptions = {};
      return;
    }
    const legendData = graph.yAxis.dataList.map((data) => data.name);
    const series: any[] = [];
    for (let i = 0; i < graph.yAxis.dataList.length; i++) {
      series.push({
        name: graph.yAxis.dataList[i].name,
        data: graph.yAxis.dataList[i]!!.data,
        type: "boxplot",
        yAxisIndex: 0,
        itemStyle: {
          color: ALL_INDICATORS_COLORS_BOXPLOT_FILLING[i],
          borderColor: INDICATOR_RED_COLOR,
        },
      });
    }
    this.chartOptions = {
      title: {
        text: graph.name,
        left: "center",
      },
      legend: {
        data: legendData,
        top: "10%",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        valueFormatter: (value) => `${Number(value).toFixed(2)}`,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        name: graph.xAxis.name,
        nameLocation: "middle",
        nameGap: 30,
        type: "category",
        data: graph.xAxis.data,
      },
      yAxis: [
        {
          type: "value",
          name: graph.yAxis.name,
          min: 0, // minimum value
          nameLocation: "middle",
          nameGap: 40,
          alignTicks: true,
        },
      ],
      series: series,
    };
  }

  private setGraphChartOptions(graph: Graph) {
    if (!graph.xAxis) {
      this.chartOptions = {};
      return;
    }
    const legendData = graph.yAxis.dataList.map((data) => data.name);
    let series: SeriesOption[] = [];
    for (let i = 0; i < graph.yAxis.dataList.length; i++) {
      let value: SeriesOption = {
        name: graph.yAxis.dataList[i].name,
        data: graph.yAxis.dataList[i]!!.data,
        type: "bar",
        yAxisIndex: 0,
      };
      if (this.chartType() === ChartType.STACK_BAR) {
        value = {
          ...value,
          stack: "total",
          itemStyle: { color: ALL_INDICATORS_COLORS_SOFT[i] },
        };
      } else if (this.chartType() === ChartType.BAR) {
        value = {
          ...value,
          itemStyle: { color: ALL_INDICATORS_COLORS[i] },
        };
      }
      series.push(value);
    }

    this.chartOptions = {
      title: {
        text: graph.name,
        left: "center",
      },
      legend: {
        data: legendData,
        top: "10%",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        valueFormatter: (value) => `${Number(value).toFixed(2)}`,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        name: graph.xAxis.name,
        nameLocation: "middle",
        nameGap: 30,
        type: "category",
        data: graph.xAxis.data,
      },
      yAxis: [
        {
          type: "value",
          name: graph.yAxis.name,
          min: 0, // minimum value
          nameLocation: "middle",
          nameGap: 60,
          alignTicks: true,
        },
      ],
      series: series,
    };
  }
}
