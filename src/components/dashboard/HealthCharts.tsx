'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HealthData {
  date: string;
  steps: number | null;
  calories: number | null;
  restingHr: number | null;
  workoutMinutes: number | null;
}

export function HealthCharts() {
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const hrChartRef = useRef<SVGSVGElement>(null);
  const workoutChartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/health/history?days=30');
      if (res.ok && !cancelled) {
        const result = await res.json();
        setData(result);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    // Resting Heart Rate Chart
    if (hrChartRef.current) {
      drawLineChart(
        hrChartRef.current,
        data.filter(d => d.restingHr !== null).map(d => ({
          date: new Date(d.date),
          value: d.restingHr!
        })),
        '#EF4444',
        'bpm'
      );
    }

    // Workout Minutes Chart (weekly average as bar chart)
    if (workoutChartRef.current) {
      const weeklyData = getWeeklyAverages(data.filter(d => d.workoutMinutes !== null));
      drawBarChart(
        workoutChartRef.current,
        weeklyData,
        '#8B5CF6'
      );
    }
  }, [data]);

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading charts...</div>;
  }

  if (data.length === 0) {
    return <div className="text-sm text-zinc-500">No health data yet</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Resting Heart Rate (30 days)
        </h4>
        <svg ref={hrChartRef} className="w-full" style={{ height: 120 }} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Weekly Workout Minutes
        </h4>
        <svg ref={workoutChartRef} className="w-full" style={{ height: 120 }} />
      </div>
    </div>
  );
}

function drawLineChart(
  svg: SVGSVGElement,
  data: { date: Date; value: number }[],
  color: string,
  unit: string
) {
  const margin = { top: 10, right: 30, bottom: 20, left: 40 };
  const width = svg.clientWidth - margin.left - margin.right;
  const height = 120 - margin.top - margin.bottom;

  d3.select(svg).selectAll('*').remove();

  if (data.length === 0) return;

  const g = d3.select(svg)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([
      (d3.min(data, d => d.value) || 0) - 5,
      (d3.max(data, d => d.value) || 100) + 5
    ])
    .range([height, 0]);

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d') as (d: Date | d3.NumberValue) => string))
    .selectAll('text')
    .attr('fill', '#71717a')
    .style('font-size', '10px');

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(4))
    .selectAll('text')
    .attr('fill', '#71717a')
    .style('font-size', '10px');

  // Line
  const line = d3.line<{ date: Date; value: number }>()
    .x(d => x(d.date))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', 2)
    .attr('d', line);

  // Dots
  g.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.value))
    .attr('r', 3)
    .attr('fill', color);
}

function drawBarChart(
  svg: SVGSVGElement,
  data: { week: string; value: number }[],
  color: string
) {
  const margin = { top: 10, right: 10, bottom: 20, left: 40 };
  const width = svg.clientWidth - margin.left - margin.right;
  const height = 120 - margin.top - margin.bottom;

  d3.select(svg).selectAll('*').remove();

  if (data.length === 0) return;

  const g = d3.select(svg)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.week))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, (d3.max(data, d => d.value) || 60) * 1.1])
    .range([height, 0]);

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('fill', '#71717a')
    .style('font-size', '10px');

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(4))
    .selectAll('text')
    .attr('fill', '#71717a')
    .style('font-size', '10px');

  // Bars
  g.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => x(d.week)!)
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.value))
    .attr('fill', color)
    .attr('rx', 2);

  // Value labels
  g.selectAll('.label')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => x(d.week)! + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#71717a')
    .style('font-size', '9px')
    .text(d => Math.round(d.value));
}

function getWeeklyAverages(data: HealthData[]): { week: string; value: number }[] {
  const weeks = new Map<string, number[]>();

  for (const d of data) {
    const date = new Date(d.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, []);
    }
    if (d.workoutMinutes !== null) {
      weeks.get(weekKey)!.push(d.workoutMinutes);
    }
  }

  return Array.from(weeks.entries())
    .map(([week, values]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: values.reduce((a, b) => a + b, 0) / values.length
    }))
    .slice(-4); // Last 4 weeks
}
