RTSP Operator
=============
## Heroku Deps
- `heroku addons:add mongolab`
- `heroku addons:add redistogo`
- `heroku config:add BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git`

## Dependencies
- Express
- Jade
- Stylus
- Redis
- a RTSP server

## Usage
- `heroku create`
- Install heroku deps
- git push heroku heroku:master