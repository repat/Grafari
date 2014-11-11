#!/bin/bash

# Falls in dem Script noch Abhängigkeiten fehlen, bitte ergänzen

# Um mechanize zu bauen, muss ruby-dev installiert werden
sudo apt-get install ruby ruby-dev

sudo gem install sinatra mechanize
