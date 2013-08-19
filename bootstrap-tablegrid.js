/*!
 * Bootstrap TableGrid Plugin v0.1
 *
 * Author: liujh
 * ==========================================================
 * Copyright 2012
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
 */

;(function( $ ){

 /* tablegrid CLASS DEFINITION
  * ========================== */
  var plugin_name = "tablegrid";
  var TableGrid = function ( element, options ) {
    this.jqTable = $(element);
    //标准化table结构
    // standardTable(this);
    //初始化
    initConfig(this, options);
    initTable(this);

    if (this.options.autoLoad) {
      this.reloadData();
    }
    return;
  };

  TableGrid.prototype = {
      constructor : TableGrid
    , options : {
          id : undefined
        , columns : []
        //数据相关
        , data_source : 'inline'   //inline, local, server
        , data_type : 'json'
        , data_url : ''
        , data_reader : {  root: "root", total: "total", page: "page", pageTotal: "pageTotal" }
        , data_post : {}
        , chkallbox : false
        //分页相关
        , page : 0  //false/0:表示无分页； 10表示每页记录数
        , records : false    //显示记录总数信息
        , toolbar : false

        // {
        //       addButton:  {icon:"icon-plus",   title:"添加"}
        //     , editButton: {icon:"icon-edit",   title:"修改"}
        //     , delButton:  {icon:"icon-remove", title:"删除"}
        //   }

        , autoLoad : false
      }
    , col_options : {
          bind : undefined
        , title : ""
        , hidden : false
      }
    , setParam : function(params) {
        console.log("setParam");
        $.extend(true, this.options.data_post ,params);
        return this;
      }
    , getParam : function(param){
        var $t = this[0];
        if (!$t || !$t.grid) {return;}
        if (!pName) { return $t.p; }
        else {return typeof($t.p[pName]) != "undefined" ? $t.p[pName] : null;}
      }
      //TODO:需添加本地js变量
    , reloadData : function() {
        log("reloadData");
        var tablegrid = this;
        if (tablegrid.options.data_source == 'server') {
          $.ajax({
              url : tablegrid.options.data_url
            , type : "POST"
            , success : function (response, textStatus) {
                response = eval(response);
                renderRemoteBody(tablegrid, response);
                renderRemoteFoot(tablegrid, response);
                tablegrid.oncomplete();
              }
            , dataType : tablegrid.options.data_type
            , data : this.options.data_post
            , error : function(XMLHttpRequest, textStatus, errorThrown) {
                alert(textStatus);
              }
          });
        }
        return this;
      }
    , empty : function() {
        this.jqTable.children("tbody").children("tr").each(function(){
          $(this).remove();
        });
        return this;
      }
    , oncomplete : function(){
        return this;
      }
  };

 /* tablegrid PRIVATE METHODS
  * ========================= */
  function getInstance(el, options) {
    //非table元素不能初始化实例
    if ("TABLE" != $(el).get(0).tagName) {
      alert("非table元素不能初始化实例");
      return;
    }
    var tablegrid = $.data(el, plugin_name);
    if (!tablegrid) {
      tablegrid = new TableGrid(el, options);
      $.data(el, plugin_name, tablegrid);
    }
    return tablegrid;
  };

  function initConfig(tablegrid, options) {
    log("initConfig");
    //读取 html table dom 中的 config
    jqTable = tablegrid.jqTable;
    options = $.extend({}, options);
    for (var key in TableGrid.prototype.options) {
      var value = jqTable.attr(key);
      if (value != undefined) {
        options[key] = value;
      }
    }
    options.chkallbox = eval(options.chkallbox);
    options.page = eval(options.page);
    options.records = eval(options.records);

    //保存
    tablegrid.options = $.extend(true, {}, TableGrid.prototype.options, options);
    //初始化col配置
    jqThead = thead(tablegrid);
    ths = jqThead.children("tr").children("th, td");
    var cols = new Array();
    var i = 0
    ths.each(function(){
      var col_options = {};
      for (var key in TableGrid.prototype.col_options) {
        var value = $(this).attr(key);
        if (value != undefined) {
          col_options[key] = value;
        }
      }

      cols[i++] = $.extend(true, {}, TableGrid.prototype.col_options, col_options);
    });
    tablegrid.cols = cols;
  };

  function initTable(tablegrid) {
    log("initTable");
    var jqTable = tablegrid.jqTable;
    options = tablegrid.options;
    //处理checkbox
    if (options.chkallbox == true) {
      chkall = $("<input type=checkbox>");
      chkall.click(function() {
        var checked = $(this).attr("checked");
        tablegrid.tbody().children("tr").each(function(i, n) {
          var chkbox = $(this).children("td:first").children("input[type='checkbox']");
          if (checked == "checked") {
            chkbox.attr("checked", true);
          } else {
            chkbox.removeAttr("checked");
          }
        });
      })
      chkall_th = $("<th style='width:15px;'></th>").append(chkall);
      thead(tablegrid).children("tr:first").prepend(chkall_th);
    }

    if (options.chkallbox == true) {
      tbody(tablegrid).children("tr").each(function(){
        $(this).prepend("<td><input type=checkbox></td>");
      });
    }
  };

  function caption(tablegrid) {
    return tablegrid.jqTable.children("caption");
  };

  function thead(tablegrid) {
    var jqTable = tablegrid.jqTable;
    var jqThead = jqTable.children("thead");
    if (jqThead.size() == 0) {
      jqThead = $("<thead></thead>");
      var th_tr = jqTable.find("tr:first");
      jqThead.append(th_tr);
      var cap = caption(tablegrid);
      if (cap[0] == undefined) {
        jqThead.prependTo(jqTable);
      } else {
        jqThead.insertAfter(cap);
      }
    }

    return jqThead;
  };

  function tbody(tablegrid) {
    var jqTable = tablegrid.jqTable;
    var jqTbody = jqTable.children("tbody");
    var jqThead = thead(tablegrid);
    if (jqTbody.size() == 0) {
      jqTbody = $("<tbody></tbody>");
      jqTbody.insertAfter(jqThead);
    }
    return jqTbody;
  };

  function tfoot(tablegrid) {
    var jqTable = tablegrid.jqTable;
    var jqTfoot = jqTable.children("tfoot");
    if (jqTfoot.size() != 0) {
      return jqTfoot;
    }
    var options = tablegrid.options;
    if (options.toolbar == false && options.pagebar == 0 && options.records == false) {
      return false;
    }

    var colspan = tablegrid.cols.length;
    if (options.chkallbox == true) {
      colspan++;
    }
    td = $("<td colspan='" + colspan + "'></td>").addClass("table-grid-gridbar");
    jqTfoot = $("<tfoot></tfoot>");
    jqTfoot.append($("<tr></tr>").append(td));

    return jqTfoot;
  };

  function toolbar(tablegrid, force_create = false) {
    log("toolbar");
    var jqTfoot = tfoot(tablegrid);
    var jqToolbar = $("tr>td>.table-grid-toolbar", jqTfoot);
    if (jqToolbar.size() == 0) {
      jqToolbar = $("<div></div>")
        .addClass("btn-toolbar")
        .addClass("table-grid-toolbar");
      $("tr>td", jqTfoot).append(jqToolbar);
    }
    return jqToolbar;
  };

  function pagebar(tablegrid) {
    log("pagebar");
    if (tablegrid.options.page == 0) {
      return false;
    }

    var jqTfoot = tfoot(tablegrid);
    var jqPagebar = $("tr>td>.table-grid-pagination", jqTfoot);
    if (jqPagebar.size() == 0) {
      jqPagebar = $("<div></div>");
      jqPagebar
        .addClass("table-grid-pagination")
        .addClass("pagination")
        .addClass("pagination-centered");
      a1 = $("<a href='#'>&laquo;</a>");
      a1.click(function(){
        log("a1");
      });
      a2 = $("<a href='#'>&lt;</a>");
      a3 = $("<a href='#'>1/1</a>");
      a4 = $("<a href='#'>&gt;</a>");
      a5 = $("<a href='#'>&raquo;</a>");
      l1 = $("<li></li>").append(a1);
      l2 = $("<li></li>").append(a2);
      l3 = $("<li class='disabled'></li>").append(a3);
      l4 = $("<li></li>").append(a4);
      l5 = $("<li></li>").append(a5);
      ul = $("<ul></ul>").append(l1).append(l2).append(l3).append(l4).append(l5);
      jqPagebar.append(ul);
      jqPagebar.insertAfter(toolbar(tablegrid));
    }
    return jqPagebar;
  };

  function recordsbar(tablegrid) {
    if (tablegrid.options.records ==false) {
      return false;
    }
    var jqTfoot = tfoot(tablegrid);
    jqRecordsbar = $("tr > td > .table-grid-records-info", jqTfoot);
    if (jqRecordsbar.size() == 0) {
      jqRecordsbar = $("<div id='asfasdfads'></div>");
      jqRecordsbar
        .addClass("table-grid-records-info");
      $("tr>td", jqTfoot).append(jqRecordsbar);
    }
    return jqRecordsbar;
  }
  
  function renderRemoteBody(tablegrid, response) {
    log("renderRemoteBody");
    jqTable = tablegrid.jqTable;
        console.log(jqTable.html());
    jqTbody = tbody(tablegrid);
    jqTbody.children("tr").each(function(){
      $(this).remove();
    });

    data_reader = tablegrid.options.data_reader;
    data = response[data_reader.root];
    console.log(data.length);
    for(var i=0; i<data.length; i++) {
      row = data[i];
      var tr = $("<tr></tr>");
      //checkbox
      if (tablegrid.options.chkallbox == true) {
        tr.append("<td><input type=checkbox></td>");
      }

      for(var j=0; j<tablegrid.cols.length; j++) {
        col = tablegrid.cols[j];
        cell_data = row[col.bind];
        var cell = $("<td>" + cell_data + "</td>");
        tr.append(cell);
      }
      console.log(tr.html());
      jqTbody.append(tr);
    }
  };

  function renderRemoteFoot(tablegrid, response) {
    data_reader = tablegrid.options.data_reader;
    var page = response[data_reader.page];
    var pageSize = tablegrid.options.page;
    var curentPageSize = response[data_reader.root].length;
    var pageTotal = response[data_reader.pageTotal];
    var total = response[data_reader.total];

    var start_num = page == 1 ? 0 : pageSize*(page - 1);
    renderPagebar(tablegrid, page, pageTotal);
    renderRecordbar(tablegrid, total, 1, 10);
  }

  function renderPagebar(tablegrid, page, pageTotal) {
    var jqPagebar = pagebar(tablegrid);
    if (jqPagebar != false) {
      var a3 = $("ul > li.disabled > a", jqPagebar);
      a3.html( " " + page + " / " + pageTotal);
    }
  };

  function renderRecordbar(tablegrid, all, start, end) {
    var jqRecordsbar = recordsbar(tablegrid);
    if (jqRecordsbar != false) {
      jqRecordsbar.text( "1 ~ 222 共 1000 条");
    }
  };

  function log(msg) {
    console.log(msg);
  };
 /* tablegrid PLUGIN DEFINITION
  * =========================== */

  //对所有选中的table进行初始化
  $.fn.tablegrid = function ( options ) {
    if (this.size() == 1) {
      return getInstance(this[0], options);
    } else if (this.size() > 1) {
      this.each(function() {
        getInstance(this, options);
      });
    }
    return this;
  };

})(window.jQuery);
