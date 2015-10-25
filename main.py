import cherrypy
import os
import random
from jinja2 import Environment, FileSystemLoader
env = Environment(loader=FileSystemLoader('templates'))

class Root:
	@cherrypy.expose
	def index(self):
		tmpl = env.get_template('index.html')
		return tmpl.render(title='Example Social Identity Map - SIM',dataset='example')

static_config = {
		'/js':
			{
				'tools.staticdir.on': True,
				'tools.staticdir.dir': os.path.join(os.path.dirname(__file__), 'static/js')
			},
		'/datasets':
			{
				'tools.staticdir.on': True,
				'tools.staticdir.dir': os.path.join(os.path.dirname(__file__), 'static/datasets')
			},
		'/images':
			{
				'tools.staticdir.on': True,
				'tools.staticdir.dir': os.path.join(os.path.dirname(__file__), 'static/images')
			},
		'/styles':
			{
				'tools.staticdir.on': True,
				'tools.staticdir.dir': os.path.join(os.path.dirname(__file__), 'static/styles')
			},
		'/':
			{
				'tools.staticdir.root' : '/home/max/sim'
			}
}

cherrypy.config.update({'server.socket_host': '139.162.6.31',
						 'server.socket_port': 8080,
						 'process_query_string' : True
						})

cherrypy.quickstart(Root(),config=static_config)