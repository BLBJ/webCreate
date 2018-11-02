var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var session = require('express-session');

var app = express();

// view engine setup
app.set('views', path.resolve(__dirname, 'views'));
const artTemplate = require('express-art-template');
app.engine('.html', artTemplate);
app.set('view engine', 'html');



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

const log4js = require("log4js");
let logger = global.logger = require("./utils/logger");
app.use(log4js.connectLogger(logger, {format: ':sessionId, :response-timems, [:url]'}));  //日志模块

const config = require('./config');
const RedisStore = require('connect-multiple-redis')(session);

//session设定
app.use(session({
    name: "user",
    secret: "secret",
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
        maxAge: config.maxAge     //Session有效期
    },
    store: new RedisStore({
        clients: config.redis,
        prefix: config.session_prefix
    }),
}));

//自动加载路由
const autoRoutes = require("ugrg-auto-routes");
let routes = express.Router();
let stack = autoRoutes(routes, path.join(__dirname, "routes"));
app.use(routes);
logger.info("已加载路由:\n", JSON.stringify(stack, null, 2));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
