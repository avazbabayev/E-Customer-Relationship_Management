var Purchase_Order = require ('../model/Purchase_Order');
var Customer = require('../model/Customer');
var Product = require('../model/Product');
var sess ;
module.exports = function(app) {
    app.get('/purchase-order/load-add', function (req, res) {

        sess = req.session;
        if(sess.name) {
            Customer.find({}, function (err, customers) {

                res.render('add_purchase_order',{
                    title:'Add New Purchase Order',
                    customers: customers,
                    session : sess
                });
            });

        }else{
            res.render('login',{title:'Login Page'});
        }
    });
    app.post('/purchase-order/add', function (req, res) {
        sess = req.session;
        if(sess.name) {

            var dateDelivery = req.param('receivedandreleaseDate');
            console.log(dateDelivery);
            Customer.find({'_id': req.param('customer')}, function (error, customer) {
                var po = new Purchase_Order();
                console.log(customer);
                po.poNumber = req.param('poNumber');
                po.poName = req.param('poName');

                po.currency = req.param('currency');
                po.deliveryTo = req.param('deliveryTo');
                po.description = req.param('note');
                po.createdDate = new Date();
                po.customer = {
                    id: req.param('customer'),
                    name: customer.last_name
                };
                po.save();
                sess.po = po;
                Product.find({}, function (err, products) {
                    res.render('add_products_to_PO',{
                        title:'Add Products into New Purchase Order',
                        products: products,
                        session : sess
                    });
                })
            });


        }else{
            res.render('login',{title:'Login Page'});
        }
    });
    app.post('/purchase-order/add-pro-into-PO', function (req, res) {
        sess = req.session;
        if(sess.name) {
           Purchase_Order.findById(sess.po._id, (err, po) => {
               var product ={
                   productID: req.param('proid'),
                   product_id: req.param('proID'),
                   product_name: req.param('proName'),
                   external_code: 'XXX',
                   costPerItem: req.param('proCost'),
                   currency: req.param('proCurrency'),
                   exchange_rate: req.param('exchangeRate'),
                   description: req.param('proNote'),
                   quantity: req.param('quantity'),
                   amount: req.param('proAmount'),
                   customer_rate: req.param('cusRate')
               };
               po.products.push(product);
               po.save((err, todo) => {
                   if (err) {
                       res.status(500).send(err)
                   }
                   sess.po = po;
                   console.log(po);
                   console.log('session: ' + sess.po);
                   res.status(200).send({
                       products : po.products
                   });
               });
           });
        }else {
            res.render('login',{title:'Login Page'});
        }
    });
    app.get('/po/ajax-get-the-product-info', function ( req, res) {
        sess = req.session;
        if(sess.name){
            //req.param('proID')
            Product.findById(req.param('proID'), (err, product) => {
                console.log('a a a a a : ' + product);
                curr = 1;
                if(sess.po.currency != product.currency){
                    curr = 2;
                }
                res.send({
                    product : product,
                    exchangeRate : curr
                });
            });
        }else {
            res.render('login',{title:'Login Page'});
        }
    });
    app.post('/purchase-order/finish-adding', function (req, res) {
        sess = req.session;
        if(sess.name) {
            Purchase_Order.findById(sess.po._id, (err, po) => {
                var total = 0;
                po.products.forEach(function (p) {
                   total = total + p.amount;
                });
                var totalAfter = (total * 0.1) + total;
                po.vat = 10;
                po.totalAmount = total;
                po.totalAfterVAT = totalAfter;
                po.save();
                sess.po = null;
            res.send({redirect: '/purchase-order/list'});
            });
        }else{
            res.render('login',{title:'Login Page'});
        }
    });
    app.get('/purchase-order/list', function (req, res) {
        sess = req.session;
        if(sess.name) {
            Purchase_Order.find({}, function (err, pos){
                if(err){
                    console.log(err);
                }else{
                    res.render('list_purchase_orders',{
                        pos: pos,
                        session: sess
                    });
                }
            });
        }else{
            res.render('login',{title:'Login Page'});
        }
    });
    app.get('/print-purchase-order', function (req, res) {
        sess = req.session;
        if(sess.name) {
        var poID = req.param('poID');
        console.log(poID);
        Purchase_Order.findById(poID, (err, po) => {
            console.log('test print'+ po);
            Customer.findById(po.customer.id, (err, cu) => {
                res.render('view_purchase_order', {
                    po: po,
                    session: sess,
                    customer: cu
                });
            });
        });
        }else{
            res.render('login',{title:'Login Page'});
        }
    });
}