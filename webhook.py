#!/usr/bin/env python3
import sys
import subprocess
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/deploy':
            # Запускаем деплой В ФОНЕ (асинхронно)
            try:
                # Запускаем deploy.sh в фоновом процессе через bash
                subprocess.Popen(
                    ['bash', '/opt/agent_assistant/deploy.sh'],
                    stdout=open('/opt/agent_assistant/deploy_output.log', 'a'),
                    stderr=subprocess.STDOUT,
                    start_new_session=True
                )
                
                # СРАЗУ возвращаем ответ (не ждем завершения деплоя)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'message': 'Deployment started in background'
                }
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'error',
                    'message': str(e)
                }
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Логирование
        with open('/opt/agent_assistant/webhook.log', 'a') as f:
            f.write(f'{self.address_string()} - {format % args}\n')

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 9000), WebhookHandler)
    print('Webhook server started on port 9000')
    server.serve_forever()

