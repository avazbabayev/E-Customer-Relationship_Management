//var User = require('../model/User');
var Employee = require('../model/Employee');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var utility = require('./Utility');
var sess ;
module.exports = function(app) {
    // Load Home page
    app.get('/',function(req,res){
        res.render('login',{title:'login page'});
    });
    //Redirect Forgot password page
    app.get('/forgot_password', function (req,res) {
        res.render('forgot_password',{title:'Forgot Password Page'});
    })
    app.post('/forgot_password', function (req, res) {
       var to = req.param('email');
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            },
            function(token, done) {
                Employee.find({ username: req.param('email') }, function(err, user) {
                    if (!user) {
                        //req.flash('error', 'No account with that email address exists.');
                        return res.redirect('/forgot_password');
                    }
                   // console.log(user);

                    user[0].passwordToken = token;
                    user[0].passwordExpires = Date.now() + 3600000; // 1 hour

                    // Save the updated document back to the database
                    user[0].save((err, todo) => {
                        if (err) {
                            res.status(500).send(err)
                        }
                        done(err, token, user);
                    });

                    //console.log(user);
                });
            },
            function(token, user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'Ecrmjs@gmail.com',
                        pass: 'adminadmin123'
                    }
                });
                var mailOptions = {
                    to: to,
                    from: 'Ecrmjs@gmail.com',
                    subject: 'ECRM is reset password',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                   // req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err) console.log(err);
            res.redirect('/forgot_password');
        });
    })
// Load Home page
    app.post('/login/checkAuthentication',function(req,res){

        Employee.find({"username": req.body.email}, function (err, user){
            if(err){
                res.render('login',{title:'Home Page'});
            }else{
                password = req.body.password;

                if(user[0].password == password)
                {
                    sess = req.session;
                    sess.name = user[0].username;
                    sess.nickname = user[0].last_name;
                    //sess.nickname = user[0].nickname;
                    res.redirect('/new-feed-general');
                   // console.log('success');
                }else{
                   // console.log('fail login');
                    res.render('login',{title:'Home Page'});
                }
            }

        });

       // res.render('add_product');
    });
    app.get('/logout', function (req,res) {
        sess = req.session;
        sess.name = "";
        res.render('login',{title:'Home Page'});
    });
    app.get('/reset/:token', function(req, res) {
        Employee.findOne({ passwordToken: req.params.token, passwordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
               // req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/forgot_password');
            }
            res.render('reset_password', {
                title : "Reset Password",
                user: req.user
            });
        });
    });
    app.post('/reset/:token', function(req, res) {
        async.waterfall([
            function(done) {
                Employee.findOne({ passwordToken: req.params.token, passwordExpires: { $gt: Date.now() } }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }

                    user.password = req.body.password;
                    user.passwordToken = undefined;
                    user.passwordExpires = undefined;

                    user.save(function(err) {
                        done(err, user);
                        res.render('login',{title:'Home Page'});
                    });
                });
            },
            function(user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'Ecrmjs@gmail.com',
                        pass: 'adminadmin123'
                    }
                });
                var mailOptions = {
                    to: user.username,
                    from: 'Ecrmjs@gmail.com',
                    subject: 'Your password has been changed',
                    text: 'Dear customer,\n\n' +
                    'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/');
        });
    });
}