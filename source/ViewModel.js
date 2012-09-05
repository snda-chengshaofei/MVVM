function ArrayViewModel(data,parent) {
    var me = new Array(data.length);
    var children = {};
    for(var i = 0; i < data.length; i++) {
        void function(p){
                Object.defineProperty(this,p,{
                    get:function(){
                        if(typeof data[p] == "object")
                            return children[p];
                        else return data[p];
                    }, 
                    set:function(v){
                        data[p] = v ;
                        if(typeof data[p] == "object") {
                            children[p] = new ViewModel(data[p],this);
                            children[p].addEventListener("propertyChange",function(e){
                                me.dispatchEvent({type:"propertyChange",propertyName:p,path:p+"."+e.path});
                            })
                        }
                        this.dispatchEvent({type:"propertyChange",propertyName:p,path:p});
                    }
                });
                if(typeof data[p] == "object") {
                    children[p] = new ViewModel(data[p],this);
                    children[p].addEventListener("propertyChange",function(e){
                        me.dispatchEvent({type:"propertyChange",propertyName:p,path:p+"."+e.path});
                    })
                }
        }.call(me,i);
    }
    this.extend = function(def) {
        var props = Object.getOwnPropertyNames(def);
        var me = this;
        props.forEach(function(p){
            var descriptor = Object.getOwnPropertyDescriptor(def,p);
            
            if(descriptor.set) {
                var setter = descriptor.set;
                descriptor.set = function(v){
                    try {
                        return setter.call(me,v)
                    } finally {
                        me.dispatchEvent({type:"propertyChange",propertyName:p,path:p});
                    }
                }
            }
            Object.defineProperty(me,p,descriptor);
        });
    }
    EventSource.call(me);
    me.addEventListener("command",function(e){
        if(typeof me[e.command] == "function") {
            me[e.command](e.target||me,e.data||data);
        }
        else me.dispatchEvent({type:"command",target:e.target||me,data:e.data||data});
    },false);
    return me;
}

function ViewModel(data,parent) {
    if(data instanceof Array)
        return new ArrayViewModel(data,parent);
    var children = {};
    var me = this;
    for(var p in data) {
        if(data.hasOwnProperty(p)) {
            void function(p){
                Object.defineProperty(this,p,{
                    get:function(){
                        if(typeof data[p] == "object")
                            return children[p];
                        else return data[p];
                    }, 
                    set:function(v){
                        data[p] = v ;
                        if(typeof data[p] == "object") {
                            children[p] = new ViewModel(data[p],this);
                            children[p].addEventListener("propertyChange",function(e){
                                me.dispatchEvent({type:"propertyChange",propertyName:p,path:p+"."+e.path});
                            })
                        }
                        this.dispatchEvent({type:"propertyChange",propertyName:p,path:p});
                    }
                });
                if(typeof data[p] == "object") {
                    children[p] = new ViewModel(data[p],this);
                    children[p].addEventListener("propertyChange",function(e){
                        me.dispatchEvent({type:"propertyChange",propertyName:p,path:p+"."+e.path});
                    })
                }
            }.call(this,p);
        }
    }

    this.extend = function(def) {
        var props = Object.getOwnPropertyNames(def);
        var me = this;
        props.forEach(function(p){
            var descriptor = Object.getOwnPropertyDescriptor(def,p);
            if(descriptor.value && descriptor.writable) {
                var value = descriptor.value;
                descriptor.get = function(v){
                    return value;
                }
                descriptor.set = function(v){
                    try {
                        return value = v;
                    } finally {
                        me.dispatchEvent({type:"propertyChange",propertyName:p,path:p});
                    }
                }
                delete descriptor.value;
                delete descriptor.writable;
            }
            if(descriptor.set) {
                var setter = descriptor.set;
                descriptor.set = function(v){
                    try {
                        return setter.call(me,v)
                    } finally {
                        me.dispatchEvent({type:"propertyChange",propertyName:p,path:p});
                    }
                }
            }
            Object.defineProperty(me,p,descriptor);
        });
    }
    EventSource.call(this);

    me.addEventListener("command",function(e){
        if(typeof me[e.command] == "function") {
            me[e.command](e.target||me,e.data||data);
        }
        else parent && parent.dispatchEvent({type:"command",target:e.target||me,data:e.data||data});
    },false);
}