# api/monitoring.py - Monitoring and analytics endpoints
from fastapi import APIRouter, Request, HTTPException, Depends
from firebase_admin import db
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import logging
from .auth import verify_firebase_token
from .models import APIResponse

router = APIRouter(prefix="/api/monitoring")
logger = logging.getLogger(__name__)

@router.post("/events",
    summary="Track Analytics Events",
    description="Receive analytics events from frontend",
    tags=["Monitoring"])
async def track_events(request: Request):
    """Receive and store analytics events from frontend"""
    try:
        data = await request.json()
        events = data.get('events', [])
        session_id = data.get('session_id')
        user_id = data.get('user_id')
        
        # Store events in Firebase
        for event in events:
            event_data = {
                **event,
                'session_id': session_id,
                'user_id': user_id,
                'received_at': datetime.now().isoformat(),
                'ip_address': request.client.host,
                'user_agent': request.headers.get('user-agent', '')
            }
            
            # Store in Firebase under analytics path
            analytics_ref = db.reference('/analytics/events')
            analytics_ref.push(event_data)
        
        logger.info(f"Stored {len(events)} analytics events")
        
        return APIResponse(
            status="success",
            message=f"Stored {len(events)} events",
            data={"events_processed": len(events)}
        ).dict()
        
    except Exception as e:
        logger.error(f"Error storing analytics events: {str(e)}")
        raise HTTPException(500, f"Failed to store events: {str(e)}")

@router.post("/",
    summary="Store Monitoring Data",
    description="Receive monitoring data from frontend",
    tags=["Monitoring"])
async def store_monitoring_data(request: Request):
    """Receive and store monitoring data from frontend"""
    try:
        data = await request.json()
        
        monitoring_data = {
            **data,
            'received_at': datetime.now().isoformat(),
            'ip_address': request.client.host,
            'user_agent': request.headers.get('user-agent', '')
        }
        
        # Store in Firebase under monitoring path
        monitor_ref = db.reference('/monitoring/data')
        monitor_ref.push(monitoring_data)
        
        # Handle alerts
        if data.get('type') == 'alert':
            await handle_alert(monitoring_data)
        
        return APIResponse(
            status="success",
            message="Monitoring data stored"
        ).dict()
        
    except Exception as e:
        logger.error(f"Error storing monitoring data: {str(e)}")
        raise HTTPException(500, f"Failed to store monitoring data: {str(e)}")

@router.get("/health",
    summary="API Health Check",
    description="Check API health status",
    tags=["Monitoring"])
async def health_check():
    """API health check endpoint"""
    try:
        start_time = datetime.now()
        
        # Check Firebase connection
        firebase_healthy = True
        try:
            db.reference('/health_check').set({
                'timestamp': start_time.isoformat(),
                'status': 'ok'
            })
        except Exception as e:
            firebase_healthy = False
            logger.error(f"Firebase health check failed: {str(e)}")
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        health_status = {
            'status': 'healthy' if firebase_healthy else 'unhealthy',
            'timestamp': end_time.isoformat(),
            'response_time_ms': response_time,
            'services': {
                'firebase': 'healthy' if firebase_healthy else 'unhealthy',
                'api': 'healthy'
            },
            'version': '1.0.0'
        }
        
        # Store health check result
        health_ref = db.reference('/monitoring/health_checks')
        health_ref.push(health_status)
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }

@router.get("/metrics",
    summary="Get System Metrics",
    description="Get system performance metrics (admin only)",
    tags=["Monitoring"])
async def get_metrics(
    user = Depends(verify_firebase_token),
    hours: int = 24
):
    """Get system metrics for the specified time period"""
    # Check admin permission
    if not user.get('admin', False):
        raise HTTPException(403, "Admin access required")
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        # Get monitoring data from Firebase
        monitor_ref = db.reference('/monitoring/data')
        all_data = monitor_ref.order_by_child('received_at').start_at(
            start_time.isoformat()
        ).end_at(end_time.isoformat()).get()
        
        if not all_data:
            return APIResponse(
                status="success",
                data={
                    'period': f'{hours} hours',
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'metrics': {}
                }
            ).dict()
        
        # Process metrics
        metrics = process_monitoring_data(all_data)
        
        return APIResponse(
            status="success",
            data={
                'period': f'{hours} hours',
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'metrics': metrics
            }
        ).dict()
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(500, f"Failed to get metrics: {str(e)}")

@router.get("/alerts",
    summary="Get System Alerts",
    description="Get system alerts (admin only)",
    tags=["Monitoring"])
async def get_alerts(
    user = Depends(verify_firebase_token),
    hours: int = 24,
    severity: Optional[str] = None
):
    """Get system alerts for the specified time period"""
    # Check admin permission
    if not user.get('admin', False):
        raise HTTPException(403, "Admin access required")
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        # Get alerts from Firebase
        alerts_ref = db.reference('/monitoring/alerts')
        all_alerts = alerts_ref.order_by_child('timestamp').start_at(
            start_time.isoformat()
        ).end_at(end_time.isoformat()).get()
        
        if not all_alerts:
            return APIResponse(
                status="success",
                data={
                    'alerts': [],
                    'count': 0,
                    'period': f'{hours} hours'
                }
            ).dict()
        
        # Filter by severity if specified
        alerts = []
        for alert_id, alert_data in all_alerts.items():
            if severity and alert_data.get('severity') != severity:
                continue
            alerts.append({
                'id': alert_id,
                **alert_data
            })
        
        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return APIResponse(
            status="success",
            data={
                'alerts': alerts,
                'count': len(alerts),
                'period': f'{hours} hours',
                'severity_filter': severity
            }
        ).dict()
        
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        raise HTTPException(500, f"Failed to get alerts: {str(e)}")

async def handle_alert(alert_data):
    """Handle incoming alerts"""
    try:
        alert = alert_data.get('data', {})
        severity = alert.get('severity', 'info')
        
        # Store alert in Firebase
        alerts_ref = db.reference('/monitoring/alerts')
        alert_id = alerts_ref.push({
            **alert,
            'received_at': alert_data.get('received_at'),
            'ip_address': alert_data.get('ip_address'),
            'user_agent': alert_data.get('user_agent')
        }).key
        
        # Send notifications for critical alerts
        if severity == 'critical':
            await send_critical_alert_notification(alert, alert_id)
        
        logger.info(f"Alert handled: {alert.get('message', 'Unknown alert')}")
        
    except Exception as e:
        logger.error(f"Error handling alert: {str(e)}")

async def send_critical_alert_notification(alert, alert_id):
    """Send notification for critical alerts"""
    try:
        # Here you would integrate with notification services
        # like Slack, email, SMS, etc.
        
        notification_data = {
            'alert_id': alert_id,
            'message': alert.get('message', 'Critical alert'),
            'category': alert.get('category', 'unknown'),
            'timestamp': alert.get('timestamp'),
            'data': alert.get('data', {})
        }
        
        # Store notification in Firebase for now
        notifications_ref = db.reference('/monitoring/notifications')
        notifications_ref.push({
            **notification_data,
            'type': 'critical_alert',
            'sent_at': datetime.now().isoformat()
        })
        
        logger.warning(f"Critical alert notification sent: {notification_data}")
        
    except Exception as e:
        logger.error(f"Error sending critical alert notification: {str(e)}")

def process_monitoring_data(data):
    """Process monitoring data to generate metrics"""
    metrics = {
        'errors': {'count': 0, 'by_type': {}},
        'performance': {'avg_response_time': 0, 'slow_requests': 0},
        'health_checks': {'total': 0, 'healthy': 0, 'unhealthy': 0},
        'alerts': {'total': 0, 'by_severity': {}},
        'memory': {'avg_usage': 0, 'peak_usage': 0},
        'network': {'total_requests': 0, 'failed_requests': 0}
    }
    
    for item_id, item_data in data.items():
        data_type = item_data.get('type')
        
        if data_type == 'error':
            metrics['errors']['count'] += 1
            error_type = item_data.get('data', {}).get('type', 'unknown')
            metrics['errors']['by_type'][error_type] = metrics['errors']['by_type'].get(error_type, 0) + 1
            
        elif data_type == 'health':
            metrics['health_checks']['total'] += 1
            results = item_data.get('data', {}).get('results', {})
            for service, result in results.items():
                if result.get('status') == 'healthy':
                    metrics['health_checks']['healthy'] += 1
                else:
                    metrics['health_checks']['unhealthy'] += 1
                    
        elif data_type == 'alert':
            metrics['alerts']['total'] += 1
            severity = item_data.get('data', {}).get('severity', 'info')
            metrics['alerts']['by_severity'][severity] = metrics['alerts']['by_severity'].get(severity, 0) + 1
    
    return metrics