// author:   Samuel Mueller 
// version:  0.0.8 
// license:  MIT 
// homepage: http://github.com/samu/angular-table 
(function() {
  var AngularTableManager, ColumnConfiguration, DeclarativeTable, PaginationTableSetup, StandardTableSetup, Table, TableConfiguration, TableSetup, calculate_from_page, erk_attribute, erk_fill_last_page, erk_initial_sorting, erk_items_per_page, erk_list, erk_sort_context, erk_sortable, irk_current_page, irk_from_page, irk_number_of_pages,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  angular.module("angular-table", []);

  irk_from_page = "from_page";

  irk_current_page = "current_page";

  irk_number_of_pages = "number_of_pages";

  erk_list = "atList";

  erk_items_per_page = "atItemsPerPage";

  erk_fill_last_page = "atFillLastPage";

  erk_sort_context = "atSortContext";

  erk_attribute = "at-attribute";

  erk_sortable = "at-sortable";

  erk_initial_sorting = "at-initial-sorting";

  calculate_from_page = function(items_per_page, current_page, list) {
    if (list) {
      return items_per_page * current_page - list.length;
    }
  };

  AngularTableManager = (function() {
    function AngularTableManager() {
      this.mappings = {};
    }

    AngularTableManager.prototype.get_table_configuration = function(id) {
      return this.mappings[id].table_configuration;
    };

    AngularTableManager.prototype.register_table = function(table_configuration) {
      var mapping, _base, _name;
      mapping = (_base = this.mappings)[_name = table_configuration.id] || (_base[_name] = {});
      mapping.table_configuration = table_configuration;
      if (mapping.pagination_scope) {
        throw "WHOOPS";
      }
    };

    AngularTableManager.prototype.register_table_scope = function(id, scope) {
      var tc;
      this.mappings[id].table_scope = scope;
      tc = this.mappings[id].table_configuration;
      if (tc.initial_items_per_page) {
        scope.$parent[tc.items_per_page] = tc.initial_items_per_page;
      }
      if (tc.initial_sort_context) {
        scope.$parent[tc.sort_context] = tc.initial_sort_context;
      }
      if (tc.initial_fill_last_page) {
        return scope.$parent[tc.fill_last_page] = tc.initial_fill_last_page;
      }
    };

    AngularTableManager.prototype.register_pagination = function(id, pagination_scope) {
      var mapping, _base;
      mapping = (_base = this.mappings)[id] || (_base[id] = {});
      mapping.pagination_scope = pagination_scope;
      if (mapping.table_configuration) {
        return pagination_scope.$watch(irk_current_page, function() {
          var ts;
          ts = mapping.table_scope;
          ts[irk_current_page] = pagination_scope[irk_current_page];
          ts[irk_number_of_pages] = pagination_scope[irk_number_of_pages];
          return ts[irk_from_page] = calculate_from_page(ts[mapping.table_configuration.items_per_page], ts[irk_current_page], ts[mapping.table_configuration.list]);
        });
      }
    };

    return AngularTableManager;

  })();

  angular.module("angular-table").service("angularTableManager", [
    function() {
      return new AngularTableManager();
    }
  ]);

  angular.module("angular-table").directive("atTable", [
    "$filter", "angularTableManager", function($filter, angularTableManager) {
      return {
        restrict: "AC",
        scope: true,
        controller: [
          "$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            var id;
            id = $attrs["id"];
            if (id) {
              return angularTableManager.register_table_scope(id, $scope);
            }
          }
        ],
        compile: function(element, attributes, transclude) {
          var dt, tc;
          tc = new TableConfiguration(attributes);
          angularTableManager.register_table(tc);
          dt = new DeclarativeTable(element, attributes, tc);
          dt.compile();
          return {
            post: function($scope, $element, $attributes) {
              return dt.post($scope, $element, $attributes, $filter);
            }
          };
        }
      };
    }
  ]);

  angular.module("angular-table").directive("atImplicit", [
    function() {
      return {
        restrict: "AC",
        compile: function(element, attributes, transclude) {
          var attribute;
          attribute = element.attr("at-attribute");
          if (!attribute) {
            throw "at-implicit specified without at-attribute: " + (element.html());
          }
          return element.append("{{item." + attribute + "}}");
        }
      };
    }
  ]);

  angular.module("angular-table").directive("atPagination", [
    "angularTableManager", function(angularTableManager) {
      return {
        replace: true,
        restrict: "E",
        template: "      <div class='pagination' style='margin: 0px;'>        <ul>          <li ng-class='{disabled: " + irk_current_page + " <= 0}'>            <a href='' ng-click='go_to_page(" + irk_current_page + " - 1)'>&laquo;</a>          </li>          <li ng-class='{active: " + irk_current_page + " == page}' ng-repeat='page in pages'>            <a href='' ng-click='go_to_page(page)'>{{page + 1}}</a>          </li>          <li ng-class='{disabled: " + irk_current_page + " >= " + irk_number_of_pages + " - 1}'>            <a href='' ng-click='go_to_page(" + irk_current_page + " + 1); normalize()'>&raquo;</a>          </li>        </ul>      </div>",
        controller: [
          "$scope", "$element", "$attrs", "angularTableManager", function($scope, $element, $attrs) {
            return angularTableManager.register_pagination($attrs.atTableId, $scope);
          }
        ],
        scope: true,
        link: function($scope, $element, $attributes) {
          var get_list, normalizePage, tc, update;
          tc = angularTableManager.get_table_configuration($attributes.atTableId);
          $scope[irk_current_page] = 0;
          get_list = function() {
            return $scope[tc.list];
          };
          update = function(reset) {
            var x;
            $scope[irk_current_page] = 0;
            if (get_list()) {
              if (get_list().length > 0) {
                $scope[irk_number_of_pages] = Math.ceil(get_list().length / $scope[tc.items_per_page]);
                return $scope.pages = (function() {
                  var _i, _ref, _results;
                  _results = [];
                  for (x = _i = 0, _ref = $scope[irk_number_of_pages] - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; x = 0 <= _ref ? ++_i : --_i) {
                    _results.push(x);
                  }
                  return _results;
                })();
              } else {
                $scope[irk_number_of_pages] = 1;
                return $scope.pages = [0];
              }
            }
          };
          normalizePage = function(page) {
            page = Math.max(0, page);
            page = Math.min($scope[irk_number_of_pages] - 1, page);
            return page;
          };
          $scope.go_to_page = function(page) {
            return $scope[irk_current_page] = normalizePage(page);
          };
          update();
          $scope.$watch(tc.items_per_page, function() {
            return update();
          });
          return $scope.$watch("atList", function() {
            return update();
          });
        }
      };
    }
  ]);

  Table = (function() {
    function Table() {}

    Table.prototype.constructHeader = function() {
      var i, tr, _i, _len, _ref;
      tr = angular.element(document.createElement("tr"));
      _ref = this.get_column_configurations();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        tr.append(i.render_html());
      }
      return tr;
    };

    Table.prototype.setup_header = function() {
      var header, thead, tr;
      thead = this.element.find("thead");
      if (thead) {
        header = this.constructHeader();
        tr = angular.element(thead).find("tr");
        tr.remove();
        return thead.append(header);
      }
    };

    Table.prototype.validateInput = function() {
      if (!this.attributes.atPagination && !this.attributes.atList) {
        throw "Either a list or Pagination must be specified.";
      }
    };

    Table.prototype.create_table_setup = function(attributes) {
      if (attributes.atList && !attributes.atPagination) {
        return new StandardTableSetup(attributes);
      }
      if (attributes.atList && attributes.atPagination) {
        return new PaginationTableSetup(attributes, this.table_configuration);
      }
    };

    Table.prototype.compile = function() {
      this.validateInput();
      this.setup_header();
      this.setup = this.create_table_setup(this.attributes);
      return this.setup.compile(this.element, this.attributes);
    };

    Table.prototype.setup_initial_sorting = function($scope) {
      var bd, _i, _len, _ref, _results;
      _ref = this.get_column_configurations();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        bd = _ref[_i];
        if (bd.initialSorting) {
          if (!bd.attribute) {
            throw "initial-sorting specified without attribute.";
          }
        }
        $scope.predicate = bd.attribute;
        _results.push($scope.descending = bd.initialSorting === "desc");
      }
      return _results;
    };

    Table.prototype.post = function($scope, $element, $attributes, $filter) {
      this.setup_initial_sorting($scope);
      $scope.getSortIcon = function(predicate) {
        if (predicate !== $scope.predicate) {
          return "icon-minus";
        }
        if ($scope.descending) {
          return "icon-chevron-down";
        } else {
          return "icon-chevron-up";
        }
      };
      return this.setup.link($scope, $element, $attributes, $filter);
    };

    return Table;

  })();

  TableSetup = (function() {
    function TableSetup() {}

    TableSetup.prototype.setupTr = function(element, repeatString) {
      var tbody, tr;
      tbody = element.find("tbody");
      tr = tbody.find("tr");
      tr.attr("ng-repeat", repeatString);
      return tbody;
    };

    return TableSetup;

  })();

  TableConfiguration = (function() {
    TableConfiguration.prototype.register_items_per_page = function(items_per_page) {
      if (isNaN(items_per_page)) {
        return this.items_per_page = items_per_page;
      } else {
        this.items_per_page = "" + this.id + "_itemsPerPage";
        return this.initial_items_per_page = parseInt(items_per_page);
      }
    };

    TableConfiguration.prototype.register_sort_context = function(sort_context) {
      if (sort_context !== void 0) {
        if (sort_context === "global") {
          this.sort_context = "" + this.id + "_sortContext";
          return this.initial_sort_context = "global";
        } else if (sort_context === "page") {
          this.sort_context = "" + this.id + "_sortContext";
          return this.initial_sort_context = "page";
        } else {
          return this.sort_context = sort_context;
        }
      } else {
        this.sort_context = "" + this.id + "_sortContext";
        return this.initial_sort_context = "global";
      }
    };

    TableConfiguration.prototype.register_fill_last_page = function(fill_last_page) {
      if (fill_last_page !== void 0) {
        if (fill_last_page === "true") {
          this.fill_last_page = "" + this.id + "_fillLastPage";
          return this.initial_fill_last_page = true;
        } else if (fill_last_page === "false") {
          this.fill_last_page = "" + this.id + "_fillLastPage";
          return this.initial_fill_last_page = false;
        } else if (fill_last_page === "") {
          this.fill_last_page = "" + this.id + "_fillLastPage";
          return this.initial_fill_last_page = true;
        } else {
          return this.fill_last_page = fill_last_page;
        }
      }
    };

    function TableConfiguration(attributes) {
      this.id = attributes.id;
      this.list = attributes[erk_list];
      if (attributes[erk_items_per_page]) {
        this.register_items_per_page(attributes[erk_items_per_page]);
      }
      this.register_sort_context(attributes[erk_sort_context]);
      this.register_fill_last_page(attributes[erk_fill_last_page]);
    }

    return TableConfiguration;

  })();

  ColumnConfiguration = (function() {
    function ColumnConfiguration(body_markup, header_markup) {
      this.attribute = body_markup.attribute;
      this.title = body_markup.title;
      this.sortable = body_markup.sortable;
      this.width = body_markup.width;
      this.initialSorting = body_markup.initialSorting;
      if (header_markup) {
        this.custom_content = header_markup.custom_content;
        this.attributes = header_markup.attributes;
      }
    }

    ColumnConfiguration.prototype.create_element = function() {
      var th;
      th = angular.element(document.createElement("th"));
      return th.attr("style", "cursor: pointer;");
    };

    ColumnConfiguration.prototype.render_title = function(element) {
      return element.html(this.custom_content || this.title);
    };

    ColumnConfiguration.prototype.render_attributes = function(element) {
      var attribute, _i, _len, _ref, _results;
      if (this.custom_content) {
        _ref = this.attributes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attribute = _ref[_i];
          _results.push(element.attr(attribute.name, attribute.value));
        }
        return _results;
      }
    };

    ColumnConfiguration.prototype.render_sorting = function(element) {
      var icon;
      if (this.sortable) {
        element.attr("ng-click", "predicate = '" + this.attribute + "'; descending = !descending;");
        icon = angular.element("<i style='margin-left: 10px;'></i>");
        icon.attr("ng-class", "getSortIcon('" + this.attribute + "')");
        return element.append(icon);
      }
    };

    ColumnConfiguration.prototype.render_width = function(element) {
      return element.attr("width", this.width);
    };

    ColumnConfiguration.prototype.render_html = function() {
      var th;
      th = this.create_element();
      this.render_title(th);
      this.render_attributes(th);
      this.render_sorting(th);
      this.render_width(th);
      return th;
    };

    return ColumnConfiguration;

  })();

  DeclarativeTable = (function(_super) {
    __extends(DeclarativeTable, _super);

    function DeclarativeTable(element, attributes, table_configuration) {
      this.element = element;
      this.attributes = attributes;
      this.table_configuration = table_configuration;
    }

    DeclarativeTable.prototype.capitaliseFirstLetter = function(string) {
      if (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      } else {
        return "";
      }
    };

    DeclarativeTable.prototype.extractWidth = function(classes) {
      var width;
      width = /([0-9]+px)/i.exec(classes);
      if (width) {
        return width[0];
      } else {
        return "";
      }
    };

    DeclarativeTable.prototype.isSortable = function(classes) {
      var sortable;
      sortable = /(sortable)/i.exec(classes);
      if (sortable) {
        return true;
      } else {
        return false;
      }
    };

    DeclarativeTable.prototype.getInitialSorting = function(td) {
      var initialSorting;
      initialSorting = td.attr("at-initial-sorting");
      if (initialSorting) {
        if (initialSorting === "asc" || initialSorting === "desc") {
          return initialSorting;
        }
        throw "Invalid value for initial-sorting: " + initialSorting + ". Allowed values are 'asc' or 'desc'.";
      }
      return void 0;
    };

    DeclarativeTable.prototype.collect_header_markup = function(table) {
      var customHeaderMarkups, th, tr, _i, _len, _ref;
      customHeaderMarkups = {};
      tr = table.find("tr");
      _ref = tr.find("th");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        th = _ref[_i];
        th = angular.element(th);
        customHeaderMarkups[th.attr("at-attribute")] = {
          custom_content: th.html(),
          attributes: th[0].attributes
        };
      }
      return customHeaderMarkups;
    };

    DeclarativeTable.prototype.collect_body_markup = function(table) {
      var attribute, bodyDefinition, initialSorting, sortable, td, title, width, _i, _len, _ref;
      bodyDefinition = [];
      _ref = table.find("td");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        td = _ref[_i];
        td = angular.element(td);
        attribute = td.attr("at-attribute");
        title = td.attr("at-title") || this.capitaliseFirstLetter(td.attr("at-attribute"));
        sortable = td.attr("at-sortable") !== void 0 || this.isSortable(td.attr("class"));
        width = this.extractWidth(td.attr("class"));
        initialSorting = this.getInitialSorting(td);
        bodyDefinition.push({
          attribute: attribute,
          title: title,
          sortable: sortable,
          width: width,
          initialSorting: initialSorting
        });
      }
      return bodyDefinition;
    };

    DeclarativeTable.prototype.create_column_configurations = function() {
      var body_markup, column_configurations, header_markup, i, _i, _len;
      header_markup = this.collect_header_markup(this.element);
      body_markup = this.collect_body_markup(this.element);
      column_configurations = [];
      for (_i = 0, _len = body_markup.length; _i < _len; _i++) {
        i = body_markup[_i];
        column_configurations.push(new ColumnConfiguration(i, header_markup[i.attribute]));
      }
      return column_configurations;
    };

    DeclarativeTable.prototype.get_column_configurations = function() {
      return this.column_configurations || (this.column_configurations = this.create_column_configurations());
    };

    DeclarativeTable.prototype.create_table_configuration = function() {};

    DeclarativeTable.prototype.get_table_configuration = function() {};

    return DeclarativeTable;

  })(Table);

  StandardTableSetup = (function(_super) {
    __extends(StandardTableSetup, _super);

    function StandardTableSetup(attributes) {
      this.repeatString = "item in " + attributes.atList + " | orderBy:predicate:descending";
    }

    StandardTableSetup.prototype.compile = function(element, attributes, transclude) {
      return this.setupTr(element, this.repeatString);
    };

    StandardTableSetup.prototype.link = function() {};

    return StandardTableSetup;

  })(TableSetup);

  PaginationTableSetup = (function(_super) {
    __extends(PaginationTableSetup, _super);

    function PaginationTableSetup(attributes, table_configuration) {
      this.table_configuration = table_configuration;
      this.repeatString = "item in filtered_list()";
    }

    PaginationTableSetup.prototype.compile = function(element, attributes, transclude) {
      var fillerTr, tbody, td, tdString, tds, _i, _len;
      tbody = this.setupTr(element, this.repeatString);
      tds = element.find("td");
      tdString = "";
      for (_i = 0, _len = tds.length; _i < _len; _i++) {
        td = tds[_i];
        tdString += "<td>&nbsp;</td>";
      }
      fillerTr = angular.element(document.createElement("tr"));
      fillerTr.attr("ng-show", this.table_configuration.fill_last_page);
      fillerTr.html(tdString);
      fillerTr.attr("ng-repeat", "item in getFillerArray() ");
      tbody.append(fillerTr);
    };

    PaginationTableSetup.prototype.link = function($scope, $element, $attributes, $filter) {
      var ipp, list_name, sc;
      list_name = this.table_configuration.list;
      ipp = this.table_configuration.items_per_page;
      sc = this.table_configuration.sort_context;
      $scope.filtered_list = function() {
        var val;
        val = $scope[list_name];
        if ($scope[sc] === "global") {
          val = $filter("orderBy")(val, $scope.predicate, $scope.descending);
          val = $filter("limitTo")(val, $scope[irk_from_page]);
          val = $filter("limitTo")(val, $scope[ipp]);
        } else {
          val = $filter("limitTo")(val, $scope[irk_from_page]);
          val = $filter("limitTo")(val, $scope[ipp]);
          val = $filter("orderBy")(val, $scope.predicate, $scope.descending);
        }
        return val;
      };
      return $scope.getFillerArray = function() {
        var fillerLength, itemCountOnLastPage, x, _i, _ref, _ref1, _results;
        if ($scope[irk_current_page] === $scope[irk_number_of_pages] - 1) {
          itemCountOnLastPage = $scope[list_name].length % $scope[ipp];
          if (itemCountOnLastPage !== 0 || $scope[list_name].length === 0) {
            fillerLength = $scope[ipp] - itemCountOnLastPage - 1;
            _results = [];
            for (x = _i = _ref = $scope[list_name].length, _ref1 = $scope[list_name].length + fillerLength; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; x = _ref <= _ref1 ? ++_i : --_i) {
              _results.push(x);
            }
            return _results;
          } else {
            return [];
          }
        }
      };
    };

    return PaginationTableSetup;

  })(TableSetup);

}).call(this);
