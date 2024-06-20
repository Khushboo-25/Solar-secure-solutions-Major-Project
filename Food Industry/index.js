var express =require('express')
var ejs= require('ejs');
var bodyParser = require('body-parser');
var mysql= require('mysql');
var session =require('express-session');


mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"node_project"
 })
 

var app=express();

app.use(express.static('public'));
app.set('view engine','ejs');

app.listen(8080);
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));


function isProductInCart(cart,id){
    for (let i=0;i<cart.length;i++)
    {
        if(cart[i].id==id)
        return true;
    }
    return false;
}

function calculateTotal(cart,req){
    if (!cart || cart.length === 0) {
        req.session.total = 0;
        return 0;
    }

    var total =0;
    for(let i=0;i<cart.length;i++)
    {
        if (cart[i]) {
            if (cart[i].sale_price) {
                total += cart[i].sale_price * cart[i].quantity;
            } else if (cart[i].price) {
                total += cart[i].price * cart[i].quantity;
            }
        }
    }
    req.session.total=total;
    return total;
}


app.get('/',function(req,res){
    var con=mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"node_project"
     })
     con.query("SELECT * FROM products",(err,result)=>{
        res.render('pages/index',{result:result});
     })
     
    
    
})










app.post('/add_to_cart',function(req,res){
    var id=req.body.id;
    var name=req.body.name;
    var price=req.body.price;
    var sale_price=req.body.sale_price;
    var quantity=req.body.quantity;
    var image=req.body.image;
    
    var product={
        id: id,
        name: name,
        price: price,
        sale_price: sale_price ? sale_price: null,
        quantity: quantity,
        image: image
    }

    if(req.session.cart){
        var cart=req.session.cart;
        if(!isProductInCart(cart,id)){
            cart.push(product);
        }
        
    }
    else{
        req.session.cart=[product];
    }

    calculateTotal(req.session.cart,req);
    res.redirect('/cart');
});

app.post('/remove_product', function(req, res) {
    var id = req.body.id;

    if (req.session.cart && req.session.cart.length > 0) {
        req.session.cart = req.session.cart.filter(function(item) {
            return item.id !== id;
        });
    }

    calculateTotal(req.session.cart, req);
    res.redirect('/cart');
});

app.post('/edit_product_quantity', function(req, res) {
    var id = req.body.id;
    var action = req.body.action; // Get action from form (increase or decrease)

    // Ensure req.session.cart exists and is initialized
    if (!req.session.cart) {
        req.session.cart = [];
    }

    var cart = req.session.cart;

    // Find the product in the cart based on id
    var found = false;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) 
            {
            found = true;
            if (action === "increase") {
                cart[i].quantity++;
            } else if (action === "decrease" && cart[i].quantity > 1) {
                cart[i].quantity--;
            }
            break;
        }
    }

    // Recalculate total and redirect to cart page
    calculateTotal(req.session.cart, req);
    res.redirect('/cart');
});

app.get('/cart',function(req,res){
     var cart=req.session.cart;
     var total=req.session.total;

     res.render('pages/cart',{cart:cart,total:total});
});


app.get('/checkout',function(req,res){
    var total=req.session.total;
    res.render('pages/checkout',{total:total})
})

app.post('/place_order',function(req,res){
    var name=req.body.name;
    var email=req.body.email;
    var phone=req.body.phone;
    var city=req.body.city;
    var address =req.body.address;
    var cost=req.session.total;
    var status="not paid";
    var date=new Date();
    var product_ids="";
    var cart=req.session.cart;
    for(let i=0;i<cart.length;i++)
        {
            product_ids=product_ids+","+cart[i].id;
        }
    

    var con=mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"node_project"
    })
    con.connect((err)=>{
        if(err)
            console.log(err);
        else
        {
            var query="INSERT INTO orders(cost,name,email,status,city,address,phone,date,product_ids) VALUES ?" ;
            var values=[[cost,name,email,status,city,address,phone,date,products_ids]];
            con.query(query,[values],(err,result)=>{
                res.redirect('/payment');
            })
        }
    })
    


})


app.get('/payment',function(req,res){
    res.render('/pages/payment');
})