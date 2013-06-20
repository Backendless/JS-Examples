Backendless.initApp("PUT-YOUR-APP-ID-HERE", "PUT-YOUR-JS-SECRET-KEY-HERE", "v1");

$('document').ready( function() {
    // bootstrap & render App
    App.store = {};
    App.store.invoices = Backendless.Persistence.of(function invoice(){});
    try{
        renderApp(App.store.invoices.find({
            options:{
                related: ["items"]
            }
        }).data);
    } catch(e){
        renderApp([]);
    }
    // handle App events
    App.on('invoice:save',   handleInvoiceSave);
    App.on('invoice:delete', handleInvoiceDelete);
    App.on('invoice:download', handleInvoiceDownload);
    App.on('invoice:send', handleInvoiceSend);

    App.on('account:signin', handleSignIn);
    App.on('account:signup', handleSignUp);
    App.on('account:signout', handleSignOut);
    App.on('account:changepassword', handleChangePassword);
    App.on('account:changeusername', handleChangeUsername);
    App.on('account:resetpassword', handleResetPassword);
    App.on('account:destroy', handleAccountDestroy);
});

var renderApp = function(invoices) {
    console.log("invoices: ", invoices);
    for(var i = 0; i < invoices.length; i++){
        App.addInvoice(invoices[i])
    }
    App.render();
}

var handleInvoiceSave = function(properties) {
    try{
        var obj = App.store.invoices.find({
            options:{
                related: ["items"]
            },
            condition: "id='" + properties.id +"'"
        }).data[0];
        console.log("obj : ", obj);
        if(obj){
            properties.objectId = obj["__updated__objectId"] || obj.objectId;
            for(var i = 0; i < obj.items.length; i++){
                for(var j = 0; j < properties.items.length; j++){
                    if(properties.items[j].id == obj.items[i].id){
                        properties.items[j].objectId = obj.items[i].objectId;
                    }
                }
            }
        }
    } catch(e){
    }finally{
        App.store.invoices.save(properties);
    }
}

var handleInvoiceDelete = function(properties) {
    console.log("delete invoice");
    App.store.invoices.remove( properties, new Backendless.Async(function(){
    }));
}

var handleInvoiceDownload = function(invoice) {
    Backendless.convert( invoice.$el )
        .to( invoice.fileName('png') )
        .download()
}

var handleInvoiceSend = function(invoice) {
    var recipient = prompt("Recipient: ");
    if (! recipient)
        return
};

var handleSignUp = function(inputs) {
    var user = new Backendless.User();
    user.login = inputs.username;
    user.email = inputs.email;
    user.password = inputs.password;
    Backendless.UserService.register( user,
        new Backendless.Async( function(){
            App.hideModalForm()
        }, function(data){
            App.renderModalFormError({error: data.message});
        }));
};
var handleSignIn = function(inputs) {
    Backendless.UserService.login( inputs.username, inputs.password,
        new Backendless.Async( function(data){
            App.user = new Backendless.User(data);
            App.hideModalForm();
            App.renderUserSignedIn(data);
        },function(data){
            console.log("data : ", data);
            App.renderUserAuthenticationError();
            App.renderModalFormError({error: data.message});
        }) );
};
var handleSignOut = function(inputs) {
    Backendless.UserService.logout(new Backendless.Async(App.renderUserSignedOut,App.renderUserAuthenticationError));
};
var handleChangePassword = function(inputs) {
    App.user.password = inputs.new_password;
    Backendless.UserService.update(App.user, new Backendless.Async( App.hideModalForm, App.renderModalFormError ));
};
var handleChangeUsername = function(inputs) {
    App.user.password = inputs.new_username;
    Backendless.UserService.update(App.user, new Backendless.Async( App.hideModalForm, App.renderModalFormError ));
};
var handleResetPassword = function(inputs) {
    Backendless.UserService.restorePassword( "login",
        new Backendless.Async( function(){
            App.hideModalForm();
            alert("send new password to " + inputs.email);
        }, App.renderModalFormError ) )
};
var handleAccountDestroy = function() {
};

var handleNewInvoiceFromRemote = function( invoice ) {
    App.addInvoice( invoice )
    App.renderInvoiceList()
};
var handleRemovedInvoiceFromRemote = function( invoice ) {
    App.removeInvoice( invoice )
    App.renderInvoiceList()
};
var handleChangedInvoiceFromRemote = function(invoice) {
    App.updateInvoice( invoice )
    App.renderInvoiceList()
};