require "rubygems"
require "watir"
require "watir-webdriver"

browser = Watir::Browser.new
browser.goto "https://www.facebook.com"
browser.text_field(:name => "email").set "haw-mi@wegwerfemail.de"
browser.text_field(:name => "pass").set "geheim123"
browser.button(:value => "Anmelden").click
puts "Logging in..."

#TODO
#browser.text_field(:name => "q").click
div = browser.div(:class => "_586i")
unless div.present?
  puts "Input bar not found!"
  exit
end

puts "Found input bar!"
div.click
puts "Entering query..."

browser.send_keys "All People living in America"
# Wait before hitting enter, to let the searchbox launch up
sleep 1 
browser.send_keys :enter
# Browser doesn't immedeatly requests the new page
sleep 1
browser.wait

# Try to scroll down a bit to get more than 4 results
5.times { 
  browser.send_keys :page_down
  sleep 0.5
}

# Let the browser complete the loading process
browser.wait 

puts "Writing content to file"
outfile = File.open("results.html", "w")
outfile.puts browser.html
outfile.close
