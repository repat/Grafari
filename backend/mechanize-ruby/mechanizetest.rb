require "rubygems"
require "mechanize"

agent = Mechanize.new

page = agent.get("https://www.facebook.com/")


login_form = page.forms.find {|f| f.action.include?("www.facebook.com/login.php") }
login_form.email = "haw-mi@wegwerfemail.de"
login_form.pass = "geheim123"


homepage = agent.submit(login_form, login_form.buttons.first)
puts "input"

homepage.search("input").each {|x|
  puts ""
  pp x
}
