// components/HeartRateChart.jsx
import React, { memo, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { CHART_COLORS, HEALTH_THRESHOLDS } from '../utils/constants'

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const HeartRateChart = memo(function HeartRateChart({ records, rangeHours, dateRange }) {
  const toMs = (ts) => (!ts ? 0 : ts < 1e12 ? ts * 1000 : ts)
  const nowMs = Date.now()
  const cutoffMs = rangeHours != null ? nowMs - rangeHours * 3600 * 1000 : null
  const startMs = dateRange?.start ? new Date(`${dateRange.start}T00:00:00`).getTime() : null
  const endMs = dateRange?.end ? new Date(`${dateRange.end}T23:59:59.999`).getTime() : null
  const filtered = useMemo(() => {
    return (records || []).filter((r) => {
      const t = toMs(r.ts)
      if (startMs != null && endMs != null) return t >= startMs && t <= endMs
      if (cutoffMs != null) return t >= cutoffMs
      return true
    })
  }, [records, startMs, endMs, cutoffMs])

  // Tính toán các giá trị thống kê nhịp tim
  const heartRateValues = filtered
    .map((r) => (typeof r.heart_rate === 'number' ? r.heart_rate : r.bpm))
    .filter((v) => typeof v === 'number' && !isNaN(v))
  const minHeart = heartRateValues.length ? Math.min(...heartRateValues) : '-'
  const maxHeart = heartRateValues.length ? Math.max(...heartRateValues) : '-'
  const avgHeart = heartRateValues.length
    ? heartRateValues.reduce((sum, v) => sum + v, 0) / heartRateValues.length
    : '-'
  const lastHeart = heartRateValues.length ? heartRateValues[heartRateValues.length - 1] : '-'

  const labels = filtered.map((r) => new Date(toMs(r.ts)))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Nhịp tim (BPM)',
        data: filtered.map((r) => r.heart_rate ?? r.bpm ?? 0),
        borderColor: '#e25563',
        backgroundColor: (ctx) => {
          const { ctx: gctx, chartArea } = ctx.chart
          if (!chartArea) return 'rgba(255, 107, 107, 0.1)'
          const gradient = gctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, 'rgba(255, 107, 107, 0.25)')
          gradient.addColorStop(1, 'rgba(255, 107, 107, 0.02)')
          return gradient
        },
        fill: 'origin',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2.5
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: (() => {
            if (dateRange?.start && dateRange?.end) {
              const span = (endMs - startMs) / (1000 * 3600)
              if (span <= 1) return 'minute'
              if (span <= 24) return 'hour'
              if (span <= 24 * 7) return 'day'
              return 'week'
            }
            if (rangeHours <= 1) return 'minute'
            if (rangeHours <= 24) return 'hour'
            if (rangeHours <= 168) return 'day'
            return 'week'
          })()
        },
        title: { display: true, text: 'Thời gian' },
        grid: { display: false }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Nhịp tim (BPM)' },
        min: 50,
        max: 120,
        ticks: { stepSize: 10 },
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (item) => `Nhịp tim: ${item.formattedValue} BPM`
        }
      }
    }
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">💓 Nhịp tim (BPM)</h3>
        <div className="chart-meta">
          Min: {minHeart}{minHeart !== '-' ? ' BPM' : ''} / Max: {maxHeart}{maxHeart !== '-' ? ' BPM' : ''} / Avg: {avgHeart !== '-' ? avgHeart.toFixed(1) + ' BPM' : '-'} / Last: {lastHeart}{lastHeart !== '-' ? ' BPM' : ''}
        </div>
      </div>
      {filtered.length > 0 ? (
        <div style={{ height: 360 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="no-data">
          <div className="no-data-icon">📈</div>
          <h3>Chưa có dữ liệu</h3>
          <p>Chưa có dữ liệu nhịp tim trong khoảng thời gian này.</p>
        </div>
      )}
      <style jsx>{`
        .chart-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.5rem; }
        .chart-meta { color: #6b7280; font-size: 0.85rem; }
      `}</style>
    </div>
  )
})

export default HeartRateChart


