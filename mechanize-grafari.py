#!/usr/bin/python
# mechanize-grafari.py

import mechanize, logging, time, datetime, sys
from flask import Flask

app = Flask(__name__)


@app.route("/")
def parsefb():
    
    # open with timeout 15 seconds
    br.open("http://www.facebook.com", timeout=15.0)

    # login form
    br.select_form( nr=0 )
    br.form[ 'email' ] = 'haw-mi@wegwerfemail.de'
    br.form[ 'pass' ] = 'geheim123'
    br.submit(id='u_0_l')

    # return all users with name john doe
    responsefile = br.retrieve('https://www.facebook.com/search/str/John%20Doe/users-named')[0]
    tmp = open(responsefile, "r")
    return tmp.read()

if __name__ == "__main__":
    # init/ convention over configuration
    br = mechanize.Browser()
    br.set_handle_robots(False)
    mechanize.Browser().handlers
    br.set_handle_redirect(mechanize.HTTPRedirectHandler)
    # pose as firefox
    br.addheaders = [('User-agent', 'Firefox')]
    app.run()
    
