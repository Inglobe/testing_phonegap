/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* Abro la base de datos */
var db = false;
var db = openDatabase('uni_ohio','1','', 3*1024*1024);
var g_usuario=Array();
for(i=0;i<10;i++) g_usuario[i]='';

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        //var = openDatabase('uni_ohio','1','', 3*1024*1024);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

/* Verificar si existe base de datos */
function verificar_base(){
  $('#cargando').show();
  if(!db){
    descargar_base_init();    
  }
  else{
    db.transaction(function(tx){tx.executeSql('select * from usuarios', [], function(tx, rs) {
      if(!rs.rows.length){
        descargar_base_init();        
      } 
      else{
        pantalla_login();
      }
    },  
    function(tx,error){ 
        descargar_base_init();
    }
    )});
  }
}

/* Descargo estructura de base de datos y usuarios */
function descargar_base_init(){
    var tablas=Array(
        "configuracion",
        "usuarios",
        "vacas",
        "partos",
        "becerros",
        "calostro"
    );
    descargar_tablas_init(db,tablas,0);
}

/* Descargo tablas */
function descargar_tablas_init(db,tablas,index){
    var total=tablas.length;
    var indice=index;
    var error = 0;
    $.ajax({
        type: "post",
        url: "http://www.mobile-promotive.com.ar/uniohio/datos.php",
        dataType: "text",
        data: { accion: "descargar_datos", tabla: tablas[indice], init:'si' },
        cache: false,
        success: function( data ){
            if(data){
                var tmp_datos = data.split('###');
                db.transaction(function(tx) {
                    for(i=0;i<tmp_datos.length;i++){
                        if(tmp_datos[i]!=''){ tx.executeSql(tmp_datos[i]); }
                    }                               
                }, function(){ error=1; }, function(){ error=0; } );
            }
            else{
                error = 1;
            }
        },
        complete: function(){ 
            if(error==1){
                alert("error");
            }
            else{
                if(indice==(total-1)){
                     pantalla_login();
                }
                else{
                    descargar_tablas_init(db,tablas,(indice+1));
                }
            }           
        },
        error: function(){
            alert("error");
        }
    });    
}

/* Pantalla Login (HTML) */
function pantalla_login(){
    html='<div class="container">'+
            '<div id="lang" style="margin-top:2%;">'+
                '<h4><a><img class="english" src="img/fondo.png" /></a></h4>'+
                '<h4><a><img class="espanol" src="img/fondo.png" /></a></h4>'+
            '</div>'+
            '<div id="logo"><img src="img/logo.png"/></div>'+
            '<div class="input-group input-group-lg loginscreen" >'+
              '<span class="input-group-addon" id="home-ico"><span class="glyphicon glyphicon-user"></span></span>'+
              '<input id="usu_codigo" type="text" class="form-control" placeholder="Username">'+
            '</div>'+
            '<div class="input-group input-group-lg">'+
              '<span class="input-group-addon" id="lock-ico"><span class="glyphicon glyphicon-lock"></span></span>'+
              '<input id="usu_password" type="password" class="form-control" placeholder="Password">'+
            '</div>'+
            '<button id="login" type="button" onclick="login()" class="btn btn-primary btn-lg">Ingresar</button>'+
        '</div>';
    $('#app').html(html);
    $('#cargando').hide();
}

/* Acceso de usuarios */
function login(){
    var usu=$('#usu_codigo').val();
    var pass=$('#usu_password').val();
    if(usu!=""&&pass!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from usuarios WHERE usu_codigo=? AND usu_password=?', [usu,pass], function(tx, rs) {
          if(rs.rows.length) {
            g_usuario[0]=rs.rows.item(0).usu_codigo;
            g_usuario[1]=rs.rows.item(0).usu_nombre;
            g_usuario[2]=rs.rows.item(0).usu_rodeo;
            pantalla_2();            
          }else{
            notificacion("Datos iconrrectos, intente nuevamente.","error");            
          }
        })});        
    }
}

/* Mostrar notificaciones de sistema */
function notificacion(texto,clase){
    $('#cargando_app').hide();
    $('#notificacion').removeClass();
    $('#notificacion').addClass(clase);
    $('#notificacion').html(texto);
    $('#notificacion').css('bottom','-30px');
    $('#notificacion').show();
    $('#notificacion').animate({ bottom: '0' }, 300);
    setTimeout(function(){
      $('#notificacion').animate({ bottom: '-30px' }, 300);
    },3000)
}

/* Pantalla 2 */
function pantalla_2(){
    $('#cargando_app').show();
    var partos='';
    db.transaction(function(tx){tx.executeSql('select * from partos WHERE par_becerros is null or par_becerros = 0 ORDER BY Datetime(substr(par_fecha,7,4)||"-"||substr(par_fecha,4,2)||"-"||substr(par_fecha,1,2)||" "||substr(par_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).par_fecha,current_date(),'minutes');
                if(diff > 90){
                    css_back='red';
                }else if(diff > 30){
                    css_back='orange';
                }else{
                    css_back='green';
                }
                partos=partos+''+
                    '<tr onclick="pantalla_4('+rs.rows.item(i).par_id+','+rs.rows.item(i).par_vaca+')">'+
                        '<td  width="50" height="35" style="background-color:'+css_back+';"></td>'+
                        '<td valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td>'+rs.rows.item(i).par_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).par_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
            '<h4><strong>Calving App</strong></h4>'+'</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a style="color:red;" href="javascript:pantalla_login()"><span class="glyphicon glyphicon-remove-circle"></span><strong> SALIR</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
        '<div class="margins">'+
        '<div class="panel panel-default">'+
          '<div class="panel-heading">Vacas Activas: '+rs.rows.length+'</div>'+
          '<div id="tableContainer" class="tableContainer">'+
          '<table id="tabla_fix" class="table table-condensed" >'+
            '<thead>'+
              '<tr>'+
                '<th width="50"></th>'+
                '<th>ID Vaca</th>'+
                '<th>Hora</th>'+
                '<th>Fecha</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody>'+
                partos+          
            '</tbody>'+
           '</table>'+       
           '</div>'+
        '</div>'+
        '<div class="functions">'+
            '<button type="button" onclick="pantalla_3()" class="addcow btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign"></span>Nuevo Parto</button>'+
            '<button id="becerro" onclick="pantalla_7()" type="submit" class="btn btn-primary btn-lg"><img style="margin-top:-5px" src="img/becerro.png">Becerros</button>'+
        '</div>'+
        '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 150
    });
    $('#cargando_app').hide();
    })});
}

/* Pantalla 3 */
function pantalla_3(){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
                '<h4><img src="img/vaca.png"/> | <strong>INFO.Vaca</strong></h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> Volver</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<form id="frm_comienzo_parto" action="">'+ 
                '<div class="margins">'+
                    '<div class="row">'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                          '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">ID</span>'+
                            '<input type="text" onblur="buscar_vaca(this.value)" name="par_vaca" id="par_vaca" class="form-control" placeholder="" maxlength="4" onKeyPress="return soloNumeros(event)">'+
                          '</div>'+
                        '</div>'+
                    '</div>'+  
                    '<div class="row">'+
                    '<div class="col-xs-6 col-sm-6 col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">Lac.</span>'+
                        '<input type="text" class="form-control" placeholder="" maxlength="2" name="par_lactancia" id="par_lactancia">'+
                      '</div>'+
                    '</div>'+
                    '<div class="col-xs-6 col-sm-6 col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">CC</span>'+
                        '<input type="text" class="form-control" placeholder="" name="par_cc" id="par_cc" onKeyPress="return soloNumeros(event)">'+
                      '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="raza col-md-12 col-xs-12 col-sm-12">'+
                        '<h4>Raza:</h4>'+
                    '</div>'+
                    '<div id="raza_option"class="col-md-12 col-xs-12 col-sm-12">'+
                        '<div class="btn-toolbar" role="toolbar">'+
                            '<div class="btn-group-justified" data-toggle="buttons">'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="h">H'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="j">J'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="x">X'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="b">B'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="r">R'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="g">G'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value=".">.'+
                                '</label>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div id="higiene" class="col-md-6 col-xs-6 col-sm-6">'+
                        '<h4>Higiene perineo</h4>'+
                    '</div>'+
                    '<div class="col-md-6 col-xs-6 col-sm-6">'+
                        '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                            '<div class="btn-group-justified" data-toggle="buttons">'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="1">1</button>'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="2">2</button>'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="3">3</button>'+
                                '</label>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="col-md-12 col-xs-12 col-sm-12">'+
                        '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">Técnico</span>'+
                            '<input type="text" class="form-control" placeholder="" name="par_tecnico" id="par_tecnico" value="'+g_usuario[1]+'">'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-12 col-xs-12 col-sm-12">'+
                        '<button type="button" onclick="comienza_parto()" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-time"></span><strong> Comienza Parto</strong></button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 4 */
function pantalla_4(par_id,vac_id){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
                '<h4><span class="glyphicon glyphicon-time"></span> | PARTO</h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span> Volver</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_fin_parto" action="">'+
                    '<div class="row">'+
                        '<div class="col-xs-8 col-sm-8 col-md-8">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">ID Vaca</span>'+
                                '<input readonly type="text" value="'+vac_id+'" class="form-control" style="height: 37px;" placeholder="" maxlength="4">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div id="higiene" class="col-xs-6 col-sm-6 col-md-6">'+
                            '<h4>Cant. Becerros</h4>'+
                        '</div>'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                            '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="1">1</button>'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="2">2</button>'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="3">3</button>'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+                  
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-xs-12 col-sm-12 col-md-12">'+
                            '<h4>Dificultad:</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="1">1'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="2">2'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="3">3'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="4">4'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="5">5'+
                                    '</label>'+
                                    
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-xs-12 col-sm-12 col-md-12">'+
                            '<h4>Raza:</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="h">H'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="j">J'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="x">X'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="b">B'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="r">R'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="g">G'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value=".">.'+
                                        '</label>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Técnico</span>'+
                                '<input type="text" name="par_tecnico_becerros" id="par_tecnico_becerros" class="form-control" placeholder="Nombre" value="'+g_usuario[1]+'">'+
                            '</div>'+
                            '<button type="button" onclick="fin_parto('+par_id+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> Listo!</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 5 */
function pantalla_5(par_id,becerro){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
                '<h4><img src="img/becerro4.png"/> | Becerro</h4>'+
            '</div>'+        
           '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> Volver</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_cargar_becerro" action="">'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="gender" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='M'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="M" '+($.isArray(becerro)&&becerro[1]=='M'?'checked':'')+'>MACHO'+
                                    '</label>'+ 
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='H'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="H" '+($.isArray(becerro)&&becerro[1]=='H'?'checked':'')+'>HEMBRA'+
                                    '</label>'+
                                '</div>'+ 
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="status_b" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label id="lbl_group7" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='v'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="v" '+($.isArray(becerro)&&becerro[2]=='v'?'checked':'')+'>V'+
                                    '</label>'+
                                    '<label id="lbl_group7" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='ma'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="ma" '+($.isArray(becerro)&&becerro[2]=='ma'?'checked':'')+'>MA'+
                                    '</label>'+
                                    '<label id="lbl_group7" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='a'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="a" '+($.isArray(becerro)&&becerro[2]=='a'?'checked':'')+'>A'+
                                    '</label>'+
                                    '<label id="lbl_group7" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='p'?'active':'')+'">'+
                                    '<input id="bec_condicion" name="bec_condicion" type="radio" value="p" '+($.isArray(becerro)&&becerro[2]=='p'?'checked':'')+'>P'+
                                    '</label>'+
                                    '<label id="lbl_group7" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='m'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="m" '+($.isArray(becerro)&&becerro[2]=='m'?'checked':'')+'>M'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div id="higiene" class="col-xs-6 col-sm-6 col-md-6">'+
                            '<h4>Presentación</h4>'+
                        '</div>'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                            '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='1'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="1" '+($.isArray(becerro)&&becerro[3]=='1'?'checked':'')+'>1</button>'+
                                    '</label>'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='2'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="2" '+($.isArray(becerro)&&becerro[3]=='2'?'checked':'')+'>2</button>'+
                                    '</label>'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='3'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="3" '+($.isArray(becerro)&&becerro[3]=='3'?'checked':'')+'>3</button>'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">N°</span>'+
                                '<input type="text" name="bec_caravana" id="bec_caravana" class="form-control" placeholder="Caravana" value="'+($.isArray(becerro)?becerro[4]:'')+'" onKeyPress="return soloNumeros(event)">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Técnico</span>'+
                                '<input type="text" name="bec_tecnico" id="bec_tecnico" class="form-control" placeholder="Nombre" value="'+($.isArray(becerro)?becerro[5]:g_usuario[1])+'">'+
                            '</div>'+
                            '<button id="btn_agregar_becerro" onclick="cargar_becerro('+par_id+','+($.isArray(becerro)?becerro[6]:0)+')" type="button" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign"></span> '+($.isArray(becerro)?'Actualizar':'Agregar')+'</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
                '<div id="tabla_becerros" style="margin-top:20px" class="row">'+                
                '</div>'+
            '</div>'+
        '</div>';
    mostrar_becerros(par_id,($.isArray(becerro)?becerro[6]:0));    
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 6 */
function pantalla_6(bec_id,bec_caravana){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
                '<h4><img src="img/becerro4.png"/>| CALOSTRO</h4>'+
            '</div>'+
           '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> Volver</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins">'+
                '<form action="" id="frm_cargar_calostro">'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">N°</span>'+
                                '<input id="bec_caravana" name="bec_caravana" readonly type="text" class="form-control" placeholder="Número" value="'+bec_caravana+'">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Calidad</span>'+
                                '<input id="cal_calidad" name="cal_calidad" type="text" class="form-control" placeholder="">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Cantidad</span>'+
                                '<input id="cal_cantidad" name="cal_cantidad" type="text" class="form-control" placeholder="" onKeyPress="return soloNumeros(event)">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Vigor</span>'+
                                '<input id="cal_vigor" name="cal_vigor" type="text" class="form-control" placeholder="">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Peso al nacer</span>'+
                                '<input id="cal_peso" name="cal_peso" type="text" class="form-control" placeholder="Kg" >'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">Técnico</span>'+
                                '<input id="cal_tecnico" name="cal_tecnico" type="text" class="form-control" placeholder="Nombre" value="'+g_usuario[1]+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<button type="button" onclick="cargar_calostro('+bec_id+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> Listo!</button>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 7 */
function pantalla_7(){
    $('#cargando_app').show();
    var becerros='';
    db.transaction(function(tx){tx.executeSql('select * from becerros, partos WHERE bec_parto=par_id and bec_muerto<>"S" and bec_id NOT IN (select cal_becerro FROM calostro where cal_becerro=bec_id) ORDER BY Datetime(substr(bec_fecha,7,4)||"-"||substr(bec_fecha,4,2)||"-"||substr(bec_fecha,1,2)||" "||substr(bec_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).bec_fecha,current_date(),'minutes');
                if(diff > 240){
                    css_back='red';
                }else if(diff > 120){
                    css_back='orange';
                }else{
                    css_back='green';
                }
                becerros=becerros+''+
                    '<tr onclick="marcar_becerro('+rs.rows.item(i).bec_id+','+rs.rows.item(i).bec_caravana+')" id="reg_becerro_'+rs.rows.item(i).bec_id+'" name="reg_becerro_'+rs.rows.item(i).bec_id+'">'+
                        '<td valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">Sincronizar</button>'+
                '<h4><strong>Calving App</strong></h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[2]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> Volver</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins">'+
                '<div class="panel panel-default">'+
                    '<div class="panel-heading">Becerros Activos: '+rs.rows.length+'</div>'+
                        '<table id="tabla_fix" class="table table-condensed">'+
                            '<thead>'+
                              '<tr>'+
                                '<th>ID Vaca</th>'+
                                '<th>Becerro</th>'+
                                '<th>Hora</th>'+
                                '<th>Fecha</th>'+
                              '</tr>'+
                            '</thead>'+
                            '<tbody>'+             
                                becerros+          
                            '</tbody>'+
                           '</table>'+       
                        '</div>'+
                        '<div class="functions_f">'+
                            '<div class="col-xs-5 col-sm-5 col-md-5">'+
                               '<button onclick="marcar_muerto()" type="button" class="ready btn btn-primary btn-lg">MUERTO</span></button>'+
                               '<input type="hidden" name="bec_marcado" id="bec_marcado" value="">'+
                               '<input type="hidden" name="bec_nro_marcado" id="bec_nro_marcado" value="">'+
                            '</div>'+
                            '<div class="col-xs-5 col-sm-5 col-md-5">'+
                              '<button onclick="marcar_calostro()" type="button" class="ready btn btn-primary btn-lg">CALOSTRO</button>'+
                            '</div>'+
                            '<div class="col-xs-2 col-sm-2 col-md-2">'+
                               '<button type="button" onclick="editar_becerro()" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-pencil" style="border-bottom: white thin solid;"></span></button>'+
                            '</div>'+
                        '</div>'+                        
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 150
    });
    $('#cargando_app').hide();
    })});
}

function comienza_parto(){
    $('#cargando_app').show();    
    if(validar_formulario('frm_comienzo_parto','todos')){
        var values = new Array();
        values[0]=$('#par_vaca').val();
        values[1]=$('#par_lactancia').val();
        values[2]=$('#par_cc').val();
        values[3]=$('#par_vaca_raza:checked').val();
        values[4]=$('#par_higiene:checked').val();
        values[5]=$('#par_tecnico').val();
        values[6]=current_date();
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [values[0]], function(tx, rs) {
          if(!rs.rows.length) {
            db.transaction(function(tx){tx.executeSql("insert into vacas (vac_id,vac_raza) VALUES ('"+values[0]+"','"+values[3]+"')")});
            ultimo_movimiento();
          }
          db.transaction(function(tx){tx.executeSql("insert into partos (par_vaca,par_lactancia,par_cc,par_vaca_raza,par_higiene,par_tecnico,par_fecha) VALUES ('"+values.join("','")+"')")});
          ultimo_movimiento();
          pantalla_2();
        })});
    }
    $('#cargando_app').hide();
}

function fin_parto(par_id){
    $('#cargando_app').show();    
    if(validar_formulario('frm_fin_parto','todos')){
        var values = new Array();
        values[0]=$('#par_becerros:checked').val();
        values[1]=$('#par_dificultad:checked').val();
        values[2]=$('#par_raza_becerros:checked').val();
        values[3]=$('#par_tecnico_becerros').val();
        values[4]=current_date();
        db.transaction(function(tx){tx.executeSql("update partos set par_becerros='"+values[0]+"', par_dificultad='"+values[1]+"', par_raza_becerros='"+values[2]+"', par_tecnico_becerros='"+values[3]+"', par_fecha_fin='"+values[4]+"' where par_id='"+par_id+"'")});
        ultimo_movimiento();
        pantalla_5(par_id);
    }
    $('#cargando_app').hide();
}

function cargar_becerro(par_id,bec_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_becerro','todos')){
        var values = new Array();
        values[0]=par_id;
        values[1]=$('#bec_sexo:checked').val();
        values[2]=$('#bec_condicion:checked').val();
        values[3]=$('#bec_presentacion:checked').val();
        values[4]=$('#bec_caravana').val();
        values[5]=$('#bec_tecnico').val();
        values[6]=current_date();
        if(bec_id>0){
            db.transaction(function(tx){tx.executeSql("update becerros set bec_sexo='"+values[1]+"', bec_condicion='"+values[2]+"', bec_presentacion='"+values[3]+"', bec_caravana='"+values[4]+"', bec_tecnico='"+values[5]+"' where bec_id='"+bec_id+"'",[],function(tx,rs){
                ultimo_movimiento();
                pantalla_5(par_id)            
            })});
        }
        else{
            db.transaction(function(tx){tx.executeSql("insert into becerros (bec_parto,bec_sexo,bec_condicion,bec_presentacion,bec_caravana,bec_tecnico,bec_fecha) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
                ultimo_movimiento();
                pantalla_5(par_id)            
            })});
        }
        
    }
    $('#cargando_app').hide();
}

function mostrar_becerros(par_id,bec_id){
    $('#cargando_app').fadeIn(300)
    var becerros='';
    var display='none';
    db.transaction(function(tx){tx.executeSql('select  * from partos, becerros where par_id=bec_parto and par_id=?', [par_id], function(tx, rs) {
        if(rs.rows.length){
            for(i=0;i<rs.rows.length;i++){
                becerros=becerros+''+
                    '<tr onclick="obtener_becerro('+rs.rows.item(i).bec_id+')">'+
                        '<td height="35" valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
            if(bec_id==0&&rs.rows.length==rs.rows.item(0).par_becerros){
                display='';
                $('#btn_agregar_becerro').hide();
            }            
            var html=''+
            '<div class="col-xs-12 col-sm-12 col-md-12">'+
                '<table id="activeb" class="table table-condensed">'+
                    '<thead>'+
                        '<tr>'+                             
                            '<th>Becerro</th>'+
                            '<th>Hora</th>'+
                            '<th>Fecha</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>'+becerros+
                '</table>'+
                '<button onclick="pantalla_2()" type="submit" class="ready btn btn-primary btn-md" style="margin-top:2px;display:'+display+'"><span class="glyphicon glyphicon-ok" ></span> Confirmar</button>'+
            '</div>';
        }        
        $('#tabla_becerros').html(html);
        $('#cargando_app').hide();
    })});
}

function buscar_vaca(id_vaca){
    if(id_vaca!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [id_vaca], function(tx, rs) {
          if(rs.rows.length) {
            $('input:radio[name=par_vaca_raza][value='+rs.rows.item(0).vac_raza+']').click();
          }
          $('#cargando_app').hide();
        })});        
    }
}

function validar_formulario(form,campos){
    var vacio=false
    var $inputs = $('#'+form+' :input');
    $inputs.each(function() {
        if(this.type=='checkbox'&&typeof($('#'+this.name+':checked').val())==="undefined") vacio=true;
        if(this.type=='radio'&&typeof($('#'+this.name+':checked').val())==="undefined") vacio=true;
        if(this.type=='text'&&$(this).val()=='') vacio=true;
    });
    if(vacio) notificacion("Complete todos los datos.","error");
    else return true;
}

function current_date(){
    var today = new Date();
    var month = today.getMonth()+1<10?'0'+today.getMonth()+1:today.getMonth()+1;
    var day = today.getDate()<10?'0'+today.getDate():today.getDate();
    var year = today.getFullYear();
    var cHour = today.getHours()<10?'0'+today.getHours():today.getHours();
    var cMin = today.getMinutes()<10?'0'+today.getMinutes():today.getMinutes();
    var cSec = today.getSeconds()<10?'0'+today.getSeconds():today.getSeconds();
    return day+"/"+month+"/"+year+" "+cHour+ ":" + cMin+ ":" +cSec;    
}

function datediff(fromDate,toDate,interval) { 
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7; 
    fromDate = new Date(fromDate); 
    toDate = new Date(toDate); 
    var timediff = toDate - fromDate; 
    if (isNaN(timediff)) return NaN; 
    switch (interval) { 
        case "years": return toDate.getFullYear() - fromDate.getFullYear(); 
        case "months": return ( 
            ( toDate.getFullYear() * 12 + toDate.getMonth() ) 
            - 
            ( fromDate.getFullYear() * 12 + fromDate.getMonth() ) 
        ); 
        case "weeks"  : return Math.floor(timediff / week); 
        case "days"   : return Math.floor(timediff / day);  
        case "hours"  : return Math.floor(timediff / hour);  
        case "minutes": return Math.floor(timediff / minute); 
        case "seconds": return Math.floor(timediff / second); 
        default: return undefined; 
    } 
}

function ultimo_movimiento(){
    db.transaction(function(tx){tx.executeSql("update configuracion set cfg_ult_act_local='"+current_date()+"'")});
}

function marcar_becerro(bec_id,bec_caravana){
    if($('#reg_becerro_'+bec_id).hasClass('marca_becerro')){
        $('#reg_becerro_'+bec_id).removeClass();
        $('#bec_marcado').val('');
        $('#bec_nro_marcado').val('');
    }
    else{
        $('tr[name*=reg_becerro_]').removeClass();
        $('#reg_becerro_'+bec_id).addClass('marca_becerro');
        $('#bec_marcado').val(bec_id);
        $('#bec_nro_marcado').val(bec_caravana);
    }    
}

function marcar_muerto(){
    if($('#bec_marcado').val()!=""){
        db.transaction(function(tx){tx.executeSql("update becerros set bec_muerto='S' where bec_id='"+$('#bec_marcado').val()+"'")});       
        ultimo_movimiento();
        pantalla_7();
    }
}

function marcar_calostro(){
    if($('#bec_marcado').val()!=""&&$('#bec_nro_marcado').val()!=""){
        pantalla_6($('#bec_marcado').val(),$('#bec_nro_marcado').val());
    }
}

function editar_becerro(){
    if($('#bec_marcado').val()!=""){        
        obtener_becerro($('#bec_marcado').val());
    }
}

function cargar_calostro(bec_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_calostro','todos')){
        var values = new Array();
        values[0]=bec_id;
        values[1]=$('#cal_calidad').val();
        values[2]=$('#cal_cantidad').val();
        values[3]=$('#cal_vigor').val();
        values[4]=$('#cal_peso').val();
        values[5]=$('#cal_tecnico').val();
        values[6]=current_date();
        db.transaction(function(tx){tx.executeSql("insert into calostro (cal_becerro,cal_calidad,cal_cantidad,cal_vigor,cal_peso,cal_tecnico,cal_fecha) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
            ultimo_movimiento();
            pantalla_7();
        })});
    }
    $('#cargando_app').hide();
}

function obtener_becerro(bec_id){
    db.transaction(function(tx){tx.executeSql('select  * from becerros where bec_id=?', [bec_id], function(tx, rs) {
        if(rs.rows.length){
            becerro=Array();
            becerro[0]=rs.rows.item(0).bec_parto;
            becerro[1]=rs.rows.item(0).bec_sexo;
            becerro[2]=rs.rows.item(0).bec_condicion;
            becerro[3]=rs.rows.item(0).bec_presentacion;
            becerro[4]=rs.rows.item(0).bec_caravana;
            becerro[5]=rs.rows.item(0).bec_tecnico;
            becerro[6]=rs.rows.item(0).bec_id;
            console.log(becerro);
            pantalla_5(rs.rows.item(0).bec_parto,becerro);
        }
        else{
            return false;
        }
    })});
}

/* Verifico si necesita actualizar la aplicacion */

function buscar_actualizaciones(){
  if(navigator.onLine){
    db.transaction(function(tx){tx.executeSql('select * from configuracion', [], function(tx, rs) {
      $.post('http://www.mobile-promotive.com.ar/uniohio/datos.php',{accion:'ultima_actualizacion',fecha:rs.rows.item(0).cfg_ult_sinc},function(res){
        if(res!="NO"){
          actualizar();
        }
        else if(datediff(rs.rows.item(0).cfg_ult_sinc,rs.rows.item(0).cfg_ult_act_local,'minutes')>60){
            actualizar();
        }
        else{
          setTimeout(function(){buscar_actualizaciones();},600000);
        }
      });
    })});
  }
}

function actualizar(){
    $('#actualizar').css('bottom','-40px');
    $('#actualizar').show();
    $('#actualizar').animate({ bottom: '0' }, 500);    
}

function actualizar_aceptar(){
    location.replace('sinc.html?kk='+Math.random());
}

function actualizar_cancelar(){
    $('#actualizar').animate({ bottom: '-40' }, 500);
}

function soloNumeros(e){
    var key = window.Event ? e.which : e.keyCode
    return (key >= 48 && key <= 57)
}

buscar_actualizaciones();