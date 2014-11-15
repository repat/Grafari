require "sinatra"


set :port, 8080
set :show_exceptions, true

get "/hi" do
  "Hello World"
end