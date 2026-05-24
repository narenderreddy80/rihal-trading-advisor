from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler(timezone="America/New_York")


def start(signal_job, digest_job):
    # Scan watchlist every 5 minutes during market hours (Mon-Fri 9:30–16:00 ET)
    _scheduler.add_job(
        signal_job,
        CronTrigger(day_of_week="mon-fri", hour="9-15", minute="*/5"),
        id="signal_scan",
        replace_existing=True,
        misfire_grace_time=60,
    )

    # Pre-market scan at 8:45 AM ET
    _scheduler.add_job(
        signal_job,
        CronTrigger(day_of_week="mon-fri", hour=8, minute=45),
        id="premarket_scan",
        replace_existing=True,
    )

    # Daily digest email at 8:30 AM ET
    _scheduler.add_job(
        digest_job,
        CronTrigger(day_of_week="mon-fri", hour=8, minute=30),
        id="daily_digest",
        replace_existing=True,
    )

    if not _scheduler.running:
        _scheduler.start()
        logger.info("Scheduler started")


def stop():
    if _scheduler.running:
        _scheduler.shutdown()
