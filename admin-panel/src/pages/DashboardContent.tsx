import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiService, DeviceChartData, HierarchyChartData, Device } from '../../services/api';
import MetricsCards from './MetricsCards';
import TopRegionsChart from './TopRegionsChart';
import GVFWLRCharts from './GVFWLRCharts';
import ProductionMap from './ProductionMap';
import FlowRateCharts from './FlowRateCharts';
import FractionsChart from './FractionsChart';
import { Clock } from 'lucide-react';

interface DashboardContentProps {
  children?: React.ReactNode;
  selectedDevice?: Device | null;
  selectedHierarchy?: any | null;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ 
  children, 
  selectedDevice, 
  selectedHierarchy 
}) => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<DeviceChartData | null>(null);
  const [hierarchyChartData, setHierarchyChartData] = useState<HierarchyChartData | null>(null);
  const [timeRange, setTimeRange] = useState('day');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load chart data when a device or hierarchy is selected
    if (selectedDevice && !selectedHierarchy) {
      loadDeviceChartData(selectedDevice.deviceId || selectedDevice.id);
      setHierarchyChartData(null); // Clear hierarchy data
    } else if (selectedHierarchy && !selectedDevice) {
      loadHierarchyChartData(selectedHierarchy.id);
      setChartData(null); // Clear device data
    }
  }, [selectedDevice, selectedHierarchy, timeRange, token]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const startAutoRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      refreshIntervalRef.current = setInterval(() => {
        setLastRefresh(new Date());
        
        // Refresh chart data without changing selections
        if (selectedDevice && !selectedHierarchy) {
          loadDeviceChartData(selectedDevice.deviceId || selectedDevice.id);
        } else if (selectedHierarchy && !selectedDevice) {
          loadHierarchyChartData(selectedHierarchy.id);
        }
      }, 5000);
    };

    startAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedDevice, selectedHierarchy, token]);

  const loadDeviceChartData = async (deviceId: number | string) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      // Use the correct property name based on the Device interface
      const deviceIdNumber = typeof deviceId === 'string' ? parseInt(deviceId) : deviceId;
      const response = await apiService.getDeviceChartDataEnhanced(deviceIdNumber, timeRange, token);
      if (response.success && response.data) {
        // Transform the enhanced API response to match the existing interface
        const transformedData: DeviceChartData = {
          device: {
            id: response.data.device.deviceId?.toString() || deviceId.toString(),
            serial_number: response.data.device.deviceSerial,
            type: response.data.device.deviceName,
            logo: response.data.device.deviceLogo,
            metadata: response.data.device.metadata,
            created_at: response.data.device.createdAt || new Date().toISOString(),
            location: response.data.device.wellName,
            company: response.data.device.companyName || 'Unknown'
          },
          chartData: response.data.chartData.map(point => ({
            timestamp: point.timestamp,
            gfr: point.gfr,
            gor: point.gor,
            gvf: point.gvf,
            ofr: point.ofr,
            wfr: point.wfr,
            wlr: point.wlr,
            pressure: point.pressure,
            temperature: point.temperature
          })),
          latestData: response.data.latestData,
          timeRange: response.data.timeRange,
          totalDataPoints: response.data.totalDataPoints
        };
        setChartData(transformedData);
      }
    } catch (error) {
      console.error('Failed to load device chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHierarchyChartData = async (hierarchyId: number | string) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getHierarchyChartDataEnhanced(Number(hierarchyId), timeRange, token);
      if (response.success && response.data) {
        setHierarchyChartData(response.data);
      }
    } catch (error) {
      console.error('Failed to load hierarchy chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if we should show TopRegionsChart or FractionsChart
  const shouldShowFractions = selectedHierarchy?.level === 'Well' || selectedDevice;
  const shouldShowTopRegions = !shouldShowFractions && (
    !selectedHierarchy || 
    selectedHierarchy.level === 'Region' || 
    selectedHierarchy.level === 'Area' || 
    selectedHierarchy.level === 'Field' ||
    selectedHierarchy.id === selectedHierarchy.name // Company level
  );

  const timeRangeOptions = [
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ];

  return (
    <div
      className={`h-full p-4 overflow-y-auto ${
        theme === 'dark' ? 'bg-[#121429]' : 'bg-gray-50'
      }`}
    >
      {children || (
        <>
          {/* Time Range Selection */}
          <div className={`mb-6 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-[#162345]' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`} />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Time Range
                </h3>
              </div>
              <div className="flex gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      timeRange === option.value
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-blue-600 text-white shadow-lg'
                        : theme === 'dark'
                          ? 'bg-[#1E2A4A] text-gray-300 hover:bg-[#2A3B5C] hover:text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {isLoading && (
              <div className="mt-3 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Loading {timeRange} data...
                </span>
              </div>
            )}
          </div>

          {/* Metrics Cards */}
          <MetricsCards 
            selectedHierarchy={selectedHierarchy}
            selectedDevice={selectedDevice}
            chartData={chartData}
            hierarchyChartData={hierarchyChartData}
            lastRefresh={lastRefresh}
            timeRange={timeRange}
          />

          {/* Flow Rate Charts */}
          <FlowRateCharts
            chartData={chartData}
            hierarchyChartData={hierarchyChartData}
            timeRange={timeRange}
          />

          {/* Main Content Grid */}
          <div className="flex gap-4 mb-4">
            {/* Conditional Chart Display */}
            {/* {shouldShowTopRegions && (
              <div className="flex-1">
                <div
                  className={`rounded-lg p-2 h-full ${
                    theme === 'dark'
                      ? 'bg-[#162345]'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <TopRegionsChart />
                </div>
              </div>
            )} */}

            {/* {shouldShowFractions && ( */}
              <div className="flex-1">
                <FractionsChart 
                  chartData={chartData}
                  hierarchyChartData={hierarchyChartData}
                  timeRange={timeRange}
                />
              </div>
            {/* )} */}

            {/* GVF/WLR Charts */}
            <div className="flex-1">
              <div
                className={`rounded-lg p-2 h-full ${
                  theme === 'dark'
                    ? 'bg-[#162345]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <GVFWLRCharts 
                  chartData={chartData}
                  hierarchyChartData={hierarchyChartData}
                  timeRange={timeRange}
                />
              </div>
            </div>
          </div>

          {/* Production Map */}
          <div className="mb-4">
            <ProductionMap 
              selectedHierarchy={selectedHierarchy}
              selectedDevice={selectedDevice}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;