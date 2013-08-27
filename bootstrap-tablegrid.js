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
        , chkallbox : false
        , multiselect : false
        //分页相关
        , page : 0  //false/0:表示无分页； 10表示每页记录数
        , records : false    //显示记录总数信息
        , toolbar : false
        , autoLoad : false
        //事件
        , post : {}
        , oncomplete : $.noop
      }
    , col_options : {
          bind : undefined
        , title : ""
        , hidden : false
        , group : false
      }
    , reloadData : function(post) {
        log("reloadData");
        var tablegrid = this;
        if (typeof post === 'function') {
          post = post.call(this);
        }
        if ($.isPlainObject(post)) {
          post = $.extend(true, {}, post);          
        } else {
          post = {};
        }
        option_post = this.options.post;
        if (typeof option_post === 'function') {
          option_post = option_post.call(this);
        }
        if ($.isPlainObject(option_post)) {
          option_post = $.extend(true, {}, option_post);          
        } else {
          option_post = {};
        }
        post = $.extend(true, {}, option_post, post);

        if (tablegrid.options.data_source == 'server') {
          $.ajax({
              url : tablegrid.options.data_url
            , type : "POST"
            , success : function (response, textStatus) {
                response = eval(response);
                data_reader = tablegrid.options.data_reader;

                data = readJson(response, data_reader.root);
                page = readJson(response, data_reader.page);
                pageTotal = readJson(response, data_reader.pageTotal);
                total = readJson(response, data_reader.total);

                renderRemoteBody(tablegrid, data);
                renderRemoteFoot(tablegrid, data, page, pageTotal, total);
                tablegrid.options.oncomplete.call(tablegrid);
              }
            , dataType : tablegrid.options.data_type
            , data : post
            , error : function(XMLHttpRequest, textStatus, errorThrown) {
                alert(textStatus);
              }
          });
        }
        return this;
      }
    , page : function(i) {
        this.reloadData({page:i, pageSize: this.options.page});
      }
    , empty : function() {
        this.jqTable.children("tbody").children("tr").each(function(){
          $(this).remove();
        });
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
    options.multiselect = eval(options.multiselect);
    options.page = eval(options.page);
    options.records = eval(options.records);
    TableGrid.prototype.options.debug = eval(options.debug);

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
      col_options.group = eval(col_options.group);
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
      chkall = $("<input type=checkbox style='margin-top: -3px;'>");
      chkall.click(function() {
        var checked = $(this).attr("checked");
        tbody(tablegrid).children("tr").each(function(i, n) {
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
    log("caption");
    return tablegrid.jqTable.children("caption");
  };

  function thead(tablegrid) {
    log("thead");
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
    log("tbody");
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
    log("tfoot");
    var jqTable = tablegrid.jqTable;
    var jqTfoot = jqTable.children("tfoot");
    if (jqTfoot.size() != 0) {
      jqThead = colspan = thead(tablegrid);
      colspan = $("tr>th", jqTfoot).size();
      $("tr>td", jqTfoot).attr("colspan", colspan);
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
      a1 = $("<a href='#' page='1'>&laquo;</a>");
      a2 = $("<a href='#'>&lt;</a>");
      a3 = $("<a href='#'>1/1</a>");
      a4 = $("<a href='#'>&gt;</a>");
      a5 = $("<a href='#'>&raquo;</a>");
      l1 = $("<li class='disabled'></li>").append(a1);
      l2 = $("<li class='disabled'></li>").append(a2);
      l3 = $("<li class='disabled'></li>").append(a3);
      l4 = $("<li class='disabled'></li>").append(a4);
      l5 = $("<li class='disabled'></li>").append(a5);
      ul = $("<ul class='disabled'></ul>").append(l1).append(l2).append(l3).append(l4).append(l5);
      jqPagebar.append(ul);
      $("li>a", ul).each(function(){
        $(this).click(function(){
          $("li", ul).addClass("disabled");
          page = $(this).attr("page");
          tablegrid.page(page);
        });
      });
      jqPagebar.insertAfter(toolbar(tablegrid));
    }
    return jqPagebar;
  };

  function recordsbar(tablegrid) {
    log("recordsbar");
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
  
  function renderRemoteBody(tablegrid, data) {
    log("renderRemoteBody");
    jqTable = tablegrid.jqTable;
    jqTbody = tbody(tablegrid);
    jqTbody.children("tr").each(function(){
      $(this).remove();
    });

    for(var i=0; i<data.length; i++) {
      row = data[i];
      var tr = $("<tr></tr>");
      tr.click(function(){
        if (tablegrid.options.chkallbox == true) {
          checkbox = $("td:first>input[type='checkbox']", this);
          if (checkbox.attr("checked") === 'checked') {
            checkbox.removeAttr("checked");
          } else {
            checkbox.attr("checked", true);
            if (tablegrid.options.multiselect == false) {
              $(this).prevAll().each(function(){
                $("td:first>input[type='checkbox']", this).removeAttr("checked");
              });
              $(this).nextAll().each(function(){
                $("td:first>input[type='checkbox']", this).removeAttr("checked");
              });
            }
          }
        }
      });
      //checkbox
      if (tablegrid.options.chkallbox == true) {
        tr.append("<td><input type=checkbox style='margin-top: -3px;'></td>");
      }

      for(var j=0; j<tablegrid.cols.length; j++) {
        col = tablegrid.cols[j];
        cell_data = row[col.bind];
        var cell = $("<td>" + cell_data + "</td>");
        if (i!=0) {
          pre_cell_data = data[i-1][col.bind];
        }
        if (i==0 || col.group != true || pre_cell_data != cell_data) { //group
            tr.append(cell); 
            jqTable.data("rowspan_" + j, 1);
        } else {
            col_rowspan = jqTable.data("rowspan_" + j);
            td_idx = j + 1;
            if (tablegrid.options.chkallbox == true) {
              td_idx++;
            }
            $("tr:nth-child(" + (i+1-col_rowspan) + ")>td:nth-child(" + td_idx +")", jqTbody)
              .attr("rowspan", col_rowspan+1);
            jqTable.data("rowspan_" + j, col_rowspan+1);
        }
      }
      jqTbody.append(tr);
    }
  };

  function renderRemoteFoot(tablegrid, root, page, pageTotal, total) {
    log("renderRemoteFoot");
    var pageSize = tablegrid.options.page;
    var curentPageSize = root.length;
    var start_num = page == 1 ? 1 : pageSize*(page - 1) + 1;
    var end_num = page == pageTotal ? total : pageSize*page;
    renderPagebar(tablegrid, page, pageTotal);
    renderRecordbar(tablegrid, total, start_num, end_num);
  }

  function renderPagebar(tablegrid, page, pageTotal) {
    log("renderPagebar");
    var jqPagebar = pagebar(tablegrid);
    if (jqPagebar != false) {
      var lis = $("ul > li", jqPagebar);
      $(lis.get(1)).children("a").attr("page", page-1);
      $("a", lis.get(2)).html( " " + page + " / " + pageTotal);
      $(lis.get(3)).children("a").attr("page", page+1);
      $(lis.get(4)).children("a").attr("page", pageTotal);

      if (1 == pageTotal) {
        // $(lis.get(0)).addClass("disabled");
        // $(lis.get(1)).addClass("disabled");
        // $(lis.get(3)).addClass("disabled");
        // $(lis.get(4)).addClass("disabled");
      } else {
        if (page == 1) {
          // $(lis.get(0)).addClass("disabled");
          // $(lis.get(1)).addClass("disabled");
          $(lis.get(3)).removeClass("disabled");
          $(lis.get(4)).removeClass("disabled");
        } else if (page == pageTotal) {
          $(lis.get(0)).removeClass("disabled");
          $(lis.get(1)).removeClass("disabled");
          // $(lis.get(3)).addClass("disabled");
          // $(lis.get(4)).addClass("disabled");
        } else {
          $(lis.get(0)).removeClass("disabled");
          $(lis.get(1)).removeClass("disabled");
          $(lis.get(3)).removeClass("disabled");
          $(lis.get(4)).removeClass("disabled");
        }
      }
    }
  };

  function renderRecordbar(tablegrid, all, start_num, end_num) {
    log("renderRecordbar");
    var jqRecordsbar = recordsbar(tablegrid);
    if (jqRecordsbar != false) {
      jqRecordsbar.text( start_num + " ~ " + end_num + " 共 " + all + " 条");
    }
  };

  function log(msg) {
    if (TableGrid.prototype.options.debug === true) {
      console.log(msg);
    }
  };

  function readJson(obj, expr) {
    log("readJson");
    var ret,p,prm = [], i;
    if( typeof expr === 'function') { return expr(obj); }
    ret = obj[expr];
    if(ret===undefined) {
      try {
        if ( typeof expr === 'string' ) {
          prm = expr.split('.');
        }
        i = prm.length;
        if( i ) {
          ret = obj;
          while (ret && i--) {
            p = prm.shift();
            ret = ret[p];
          }
        }
      } catch (e) {}
    }
    return ret;
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
