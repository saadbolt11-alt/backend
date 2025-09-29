import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ExternalLink, Info, MoreHorizontal } from 'lucide-react';
import { DeviceChartData, HierarchyChartData } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

interface FlowRateChartsProps {
  chartData?: DeviceChartData | null;
  hierarchyChartData?: HierarchyChartData | null;
  timeRange?: string;
}

interface SingleFlowRateChartProps {
  title: string;
  unit: string;
  data: any[];
  dataKey: string;
  maxValue?: number;
  timeRange: string;
}

const FlowRateChart: React.FC<SingleFlowRateChartProps> = ({
  title,
  unit,
  data,
  dataKey,
  maxValue,
  timeRange,
}) => {
  const { theme } = useTheme();

  // Calculate dynamic Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (maxValue !== undefined) {
      const upperBound = Math.ceil(maxValue * 1.2); // 20% above max value
      return [0, upperBound];
    }
    return [0, 12000]; // fallback
  }, [maxValue]);

  // Dynamic X-axis formatter based on time range
  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    switch (timeRange) {
      case 'hour':
      case 'day':
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case 'week':
        return date.toLocaleDateString('en-GB', {
          month: 'short',
          day: '2-digit'
        }) + ' ' + date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case 'month':
        return date.toLocaleDateString('en-GB', {
          month: 'short',
          day: '2-digit'
        });
      default:
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
    }
  };

  return (
    <div
      className={`rounded-lg p-4 ${
        theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3
            className={`text-base font-medium ${
              theme === 'dark' ? 'text-[#fff]' : 'text-[#0f0f0f]'
            }`}
          >
            {title} ({unit})
          </h3>
          <Info
            className={`text-sm ${
              theme === 'dark' ? 'text-[#D0CCD8]' : 'text-[#555758]'
            }`}
          />
        </div>
        <div
          className={`flex items-center gap-2 border px-2 py-1 rounded-md ${
            theme === 'dark'
              ? 'border-[#D0CCD8] text-gray-400 hover:text-white'
              : 'border-[#EAEAEA] text-gray-600 hover:text-gray-900'
          }`}
        >
          <ExternalLink
            size={16}
            className="dark:text-white cursor-pointer dark:hover:text-gray-200"
          />
          <MoreHorizontal
            size={16}
            className="text-gray-400 dark:text-white cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
          />
        </div>
      </div>

      <div className="mb-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-[#38BF9D] dark:bg-[#EC4899] rounded"></div>
            <span
              className={`text-sm font-thin ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Line Condition
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          <CartesianGrid
            stroke={theme === 'dark' ? '#d5dae740' : '#E5E7EB'}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="time"
            stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
            fontSize={10}
            tickMargin={20}
            tickFormatter={formatXAxisTick}
          />
          <YAxis
            stroke={theme === 'dark' ? '#A2AED4' : '#6B7280'}
            fontSize={13}
            tickMargin={20}
            domain={yAxisDomain}
            tickFormatter={(value) => {
              if (value === 0) return '00';
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return value.toString();
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={theme === 'dark' ? '#EC4899' : '#38BF9D'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const FlowRateCharts: React.FC<FlowRateChartsProps> = ({
  chartData,
  hierarchyChartData,
  timeRange = 'day',
}) => {
  // Transform API data to chart format
  const ofrData = useMemo(() => {
    if (chartData?.chartData) {
      return chartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.ofr || 0,
        standard: point.ofr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      return hierarchyChartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.totalOfr || 0,
        standard: point.totalOfr || 0,
      }));
    }
    // Return empty array if no data
    return [];
  }, [chartData, hierarchyChartData]);

  const wfrData = useMemo(() => {
    if (chartData?.chartData) {
      return chartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.wfr || 0,
        standard: point.wfr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      return hierarchyChartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.totalWfr || 0,
        standard: point.totalWfr || 0,
      }));
    }
    // Return empty array if no data
    return [];
  }, [chartData, hierarchyChartData]);

  const gfrData = useMemo(() => {
    if (chartData?.chartData) {
      return chartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.gfr || 0,
        standard: point.gfr || 0,
      }));
    } else if (hierarchyChartData?.chartData) {
      return hierarchyChartData.chartData.map((point) => ({
        time: point.timestamp, // Use raw timestamp for dynamic formatting
        line: point.totalGfr || 0,
        standard: point.totalGfr || 0,
      }));
    }
    // Return empty array if no data
    return [];
  }, [chartData, hierarchyChartData]);

  // Calculate max values for OFR and WFR to ensure same scale
  const ofrWfrMaxValue = useMemo(() => {
    const ofrMax = Math.max(...ofrData.map(d => d.line), 0);
    const wfrMax = Math.max(...wfrData.map(d => d.line), 0);
    return Math.max(ofrMax, wfrMax);
  }, [ofrData, wfrData]);

  const gfrMaxValue = useMemo(() => {
    return Math.max(...gfrData.map(d => d.line), 0);
  }, [gfrData]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <FlowRateChart 
        title="OFR" 
        unit="bpd" 
        data={ofrData} 
        dataKey="line" 
        maxValue={ofrWfrMaxValue} 
        timeRange={timeRange}
      />
      <FlowRateChart 
        title="WFR" 
        unit="bpd" 
        data={wfrData} 
        dataKey="line" 
        maxValue={ofrWfrMaxValue} 
        timeRange={timeRange}
      />
      <FlowRateChart 
        title="GFR" 
        unit="bpd" 
        data={gfrData} 
        dataKey="line" 
        maxValue={gfrMaxValue} 
        timeRange={timeRange}
      />
    </div>
  );
};

export default FlowRateCharts;