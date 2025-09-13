// components/LazyComponents.jsx - Lazy loaded components for better performance
import { lazy, Suspense } from 'react'
import LoadingSpinner from './LoadingSpinner'

// Lazy load heavy components
export const LazyAdminPage = lazy(() => import('../pages/admin'))
export const LazyAIPage = lazy(() => import('../pages/ai'))
export const LazyDeviceManagementPage = lazy(() => import('../pages/device-management'))
export const LazySchedulePage = lazy(() => import('../pages/schedule'))
export const LazyAnimationDemo = lazy(() => import('../pages/animation-demo'))

// Lazy load heavy dashboard components
export const LazyHeartRateChart = lazy(() => import('./HeartRateChart'))
export const LazySpo2Chart = lazy(() => import('./Spo2Chart'))
export const LazyRecordsChart = lazy(() => import('./RecordsChart'))

// Lazy load admin components
export const LazyUsersManagement = lazy(() => import('./Admin/UsersManagement'))

// HOC to wrap lazy components with suspense
export const withSuspense = (LazyComponent, fallback = <LoadingSpinner />) => {
  const WrappedComponent = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
  
  WrappedComponent.displayName = `withSuspense(${LazyComponent.displayName || 'Component'})`
  
  return WrappedComponent
}

// Pre-configured lazy components with suspense
export const AdminPageWithSuspense = withSuspense(LazyAdminPage)
export const AIPageWithSuspense = withSuspense(LazyAIPage)
export const DeviceManagementPageWithSuspense = withSuspense(LazyDeviceManagementPage)
export const SchedulePageWithSuspense = withSuspense(LazySchedulePage)
export const AnimationDemoWithSuspense = withSuspense(LazyAnimationDemo)

export const HeartRateChartWithSuspense = withSuspense(LazyHeartRateChart)
export const Spo2ChartWithSuspense = withSuspense(LazySpo2Chart)
export const RecordsChartWithSuspense = withSuspense(LazyRecordsChart)

export const UsersManagementWithSuspense = withSuspense(LazyUsersManagement)

// Custom loading components for different scenarios
export const ChartLoadingFallback = () => (
  <div className="chart-loading">
    <div className="chart-skeleton">
      <div className="skeleton-header"></div>
      <div className="skeleton-chart"></div>
    </div>
    <style jsx>{`
      .chart-loading {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin: 1rem 0;
      }
      
      .chart-skeleton {
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .skeleton-header {
        height: 20px;
        background: #e9ecef;
        border-radius: 4px;
        margin-bottom: 1rem;
        width: 200px;
      }
      
      .skeleton-chart {
        height: 300px;
        background: #e9ecef;
        border-radius: 4px;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
)

export const PageLoadingFallback = () => (
  <div className="page-loading">
    <LoadingSpinner />
    <p>Đang tải trang...</p>
    <style jsx>{`
      .page-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 1rem;
      }
      
      .page-loading p {
        color: #6c757d;
        margin: 0;
      }
    `}</style>
  </div>
)

// Lazy components with custom loading
export const HeartRateChartLazy = withSuspense(LazyHeartRateChart, <ChartLoadingFallback />)
export const Spo2ChartLazy = withSuspense(LazySpo2Chart, <ChartLoadingFallback />)
export const RecordsChartLazy = withSuspense(LazyRecordsChart, <ChartLoadingFallback />)

export const AdminPageLazy = withSuspense(LazyAdminPage, <PageLoadingFallback />)
export const AIPageLazy = withSuspense(LazyAIPage, <PageLoadingFallback />)
export const DeviceManagementPageLazy = withSuspense(LazyDeviceManagementPage, <PageLoadingFallback />)
export const SchedulePageLazy = withSuspense(LazySchedulePage, <PageLoadingFallback />)
export const AnimationDemoLazy = withSuspense(LazyAnimationDemo, <PageLoadingFallback />)