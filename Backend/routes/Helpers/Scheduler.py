from flask_apscheduler import APScheduler
from routes.Helpers.Helper import sendBatchLines

scheduler = APScheduler()

@scheduler.task('cron', id='daily_batch', hour=8, minute=0)
def daily_batch_job():
    sendBatchLines()