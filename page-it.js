(function($){

    var methods = {
        init: function(options) {
            var o = $.extend({
                itemsOnPage: 1,
                displayedPages: 5,
                display: '', // ex table-row
                edges: 2,
                scroll: false,
                currentPage: 1,
                hrefTextPrefix: '#page-',
                hrefTextSuffix: '',
                prevText: 'Prev',
                nextText: 'Next',
                ellipseText: '&hellip;',
                cssStyle: 'light-theme',
                labelMap: [],
                items: null,
                selectOnClick: true,
                nextAtFront: false,
                search: null,
                sort: false,
                sortContainer: null, // the table header (parent of sort buttons)
                sortExceptions: [],
                sortAlts: {}, // {2:3, 4:0} etc
                sortOptions: {}, // for tinysort
                ascIcon: '<i class="sort-icon pull-right fa fa-caret-up"></i>',
                descIcon: '<i class="sort-icon pull-right fa fa-caret-down"></i>',
                sortIcon: '<i class="sort-icon pull-right fa fa-sort"></i>',
                highlightOnClick: false,
                onPageClick: function(pageNumber, event) {
                    // Callback triggered when a page is clicked
                    // Page number is given as an optional parameter
                },
                onInit: function() {
                    // Callback triggered immediately after initialization
                },
                onFilter: function(filterString, filterItems) {

                },
                onItemClick: function(item){

                }
            }, options || {});

            var self = this;

            if(!window.tsort && o.sort) {
                $('body').append('<script type="text/javascript" src="https://raw.github.com/Sjeiti/TinySort/master/dist/jquery.tinysort.min.js"></script>');
            }

            o.filteredItems = $();
            o.pages = !o.items ? 1 : o.scroll ? o.items.length-o.itemsOnPage+1 : Math.ceil(o.items.length * 1.0 / o.itemsOnPage) ? Math.ceil(o.items.length * 1.0 / o.itemsOnPage) : 1;
            o.currentPage = o.currentPage - 1;
            o.halfDisplayed = o.displayedPages / 2;
            o.items.on('click', function(){
                if(o.highlightOnClick){
                    o.items.removeClass('selected');
                    $(this).addClass('selected');
                }
                o.onItemClick($(this));
            });
            this.each(function() {
                self.addClass(o.cssStyle + ' simple-pagination').data('pagination', o);
                methods._draw.call(self);
            });
            if (o.items && o.currentPage <= o.pages) {
                var start_index, end_index;
                if(o.scroll){
                    start_index = o.currentPage;
                    end_index = o.currentPage + o.itemsOnPage;
                }
                else{
                    start_index = o.currentPage*o.itemsOnPage;
                    end_index = (o.currentPage+1)*o.itemsOnPage;

                }
                if(Object.prototype.toString.call( o.items ) === '[object Array]'){
                    o.search = null;
                    o.items.forEach(function(element){
                        element.removeClass('table-row-visible').hide();
                    });
                    if (o.currentPage == o.pages)
                        o.items.slice(start_index).forEach(function(element){
                            element.addClass('table-row-visible').css('display',o.display);
                        });
                    else
                        o.items.slice(start_index, end_index).forEach(function(element){
                            element.addClass('table-row-visible').css('display',o.display);
                        });
                }
                else{
                    o.items.removeClass('table-row-visible').hide();
                    if (o.currentPage == o.pages)
                        o.items.slice(start_index).addClass('table-row-visible').css('display',o.display);
                    else
                        o.items.slice(start_index, end_index).addClass('table-row-visible').css('display',o.display);
                }
                start_index = end_index = null;
            }
            if(o.search){
                o.search.prop('autocomplete', 'off');
                o.search.keyup(function(e){
                    methods.filter.call(self, $(this).val().toLowerCase());
                });
            }
            if(o.sort) {
                if(o.sortContainer) {
                    for(var i=1; i<=o.sortContainer.children().size(); i++) {
                    if(i-1 in o.sortExceptions) continue;
                    var head = o.sortContainer.children(':nth-child('+i+')');
                    head.data('index',i);
                    // make the head's content float left and have a smaller width
                    html = "<div style='float:left;width:calc(100% - 20px)'>" + head.html() + "</div>";
                    head.html(html);
                    // append asc/desc icons from the start so head looks sortable
                    head.append(o.sortIcon);
                    head.css('cursor','pointer');
                    head.on('click', function() {
                        var $this = $(this);
                        var n = parseInt($this.data('index'));
                        var extra = {};
                        if(n-1 in o.sortOptions) {
                            extra = o.sortOptions[n-1];
                        }
                        if(n-1 in o.sortAlts) {
                            n = o.sortAlts[n-1] + 1;
                        }
                        // remove all icons to get rid of stray up/downsort indicators
                        o.sortContainer.find('.sort-icon').remove();
                        // go through heads and replace sort placeholders
                        for(var i=1; i<=o.sortContainer.children().size(); i++) {
                            if(i-1 in o.sortExceptions) continue;
                            var temphead = o.sortContainer.children(':nth-child('+i+')');
                            temphead.append(o.sortIcon);
                        }
                        // finally, remove placeholder just from this head
                        $this.find('.sort-icon').remove();
                        // sort and add proper icon
                        if($this.hasClass('sorting_asc')) {
                            o.items.tsort('li:nth-child('+n+'),td:nth-child('+n+')', $.extend({},{order:'desc'},extra));
                            $this.removeClass('sorting_asc').addClass('sorting_desc');
                            $this.append(o.descIcon);
                        }
                        else {
                            o.sortContainer.children('[class*="sorting_"]').removeClass('sorting_asc').removeClass('sorting_desc');
                            o.items.tsort('li:nth-child('+n+'),td:nth-child('+n+')', $.extend({},{order:'asc'},extra));
                            $this.removeClass('sorting_desc').addClass('sorting_asc');
                            $this.append(o.ascIcon);
                        }
                        methods.updateItems.call(self, o.items.not(o.filteredItems), o.currentPage+1);
                    });
                    }
                }
                else {
                    console.log("Sort is set, but there is no sortContainer. Sort not implemented.");
                }
            }
            o.onInit();

            return this;
        },

        selectPage: function(page) {
            methods._selectPage.call(this, page - 1);
            return this;
        },

        prevPage: function() {
            var o = this.data('pagination');
            if (o.currentPage > 0) {
                methods._selectPage.call(this, o.currentPage - 1);
            }
            return this;
        },

        nextPage: function() {
            var o = this.data('pagination');
            if (o.currentPage < o.pages - 1) {
                methods._selectPage.call(this, o.currentPage + 1);
            }
            return this;
        },

        getPagesCount: function() {
            return this.data('pagination').pages;
        },

        getCurrentPage: function () {
            return this.data('pagination').currentPage + 1;
        },

        destroy: function(){
            this.empty();
            return this;
        },

        drawPage: function (page) {
            var o = this.data('pagination');
            o.currentPage = page - 1;
            this.data('pagination', o);
            methods._draw.call(this);
            return this;
        },

        redraw: function(){
            methods._draw.call(this);
            return this;
        },

        disable: function(){
            var o = this.data('pagination');
            o.disabled = true;
            this.data('pagination', o);
            methods._draw.call(this);
            return this;
        },

        enable: function(){
            var o = this.data('pagination');
            o.disabled = false;
            this.data('pagination', o);
            methods._draw.call(this);
            return this;
        },

        filter: function(filterString){
            var o = this.data('pagination');
            o.items.removeClass('table-row-visible').hide();
            if(filterString==''){
                methods.updateItems.call(this, o.items.add(o.filteredItems), o.prevPage + 1);
                o.filteredItems = $();
                o.prevPage = null;
            }
            else{
                o.items = o.filteredItems.add(o.items);
                o.filteredItems = o.items.not(('[data-search*="'+filterString+'"]'));
                if(!o.prevPage)
                    o.prevPage = o.currentPage;
                methods.updateItems.call(this, o.items.not(o.filteredItems));
            }
            return o.onFilter(filterString, o.items);
        },

        updateItems: function (newItems, pageIndex) {
            var o = this.data('pagination');
            o.items = newItems;
            o.pages = methods._getPages(o);
            this.data('pagination', o);
            if(!pageIndex)
                pageIndex = 1;
            return methods.selectPage.call(this, pageIndex);
        },

        updateItemsOnPage: function (itemsOnPage) {
            var o = this.data('pagination');
            o.itemsOnPage = itemsOnPage;
            o.pages = methods._getPages(o);
            this.data('pagination', o);
            methods._selectPage.call(this, 0);
            return this;
        },

        _draw: function() {
            var o = this.data('pagination'),
                interval = methods._getInterval(o),
                i,
                tagName;

            methods.destroy.call(this);

            tagName = (typeof this.prop === 'function') ? this.prop('tagName') : this.attr('tagName');

            var $panel = tagName === 'UL' ? this : $('<ul></ul>').appendTo(this);

            // Generate Prev link
            if (o.prevText) {
                methods._appendItem.call(this, o.currentPage - 1, {text: o.prevText, classes: 'prev'});
            }

            // Generate Next link (if option set for at front)
            if (o.nextText && o.nextAtFront) {
                methods._appendItem.call(this, o.currentPage + 1, {text: o.nextText, classes: 'next'});
            }

            // Generate start edges
            if (interval.start > 0 && o.edges > 0) {
                var end = Math.min(o.edges, interval.start);
                for (i = 0; i < end; i++) {
                    methods._appendItem.call(this, i);
                }
                if (o.edges < interval.start && (interval.start - o.edges != 1)) {
                    $panel.append('<li class="disabled"><span class="ellipse">' + o.ellipseText + '</span></li>');
                } else if (interval.start - o.edges == 1) {
                    methods._appendItem.call(this, o.edges);
                }
            }

            // Generate interval links
            for (i = interval.start; i < interval.end; i++) {
                methods._appendItem.call(this, i);
            }

            // Generate end edges
            if (interval.end < o.pages && o.edges > 0) {
                if (o.pages - o.edges > interval.end && (o.pages - o.edges - interval.end != 1)) {
                    $panel.append('<li class="disabled"><span class="ellipse">' + o.ellipseText + '</span></li>');
                } else if (o.pages - o.edges - interval.end == 1) {
                    methods._appendItem.call(this, interval.end++);
                }
                var begin = Math.max(o.pages - o.edges, interval.end);
                for (i = begin; i < o.pages; i++) {
                    methods._appendItem.call(this, i);
                }
            }

            // Generate Next link (unless option is set for at front)
            if (o.nextText && !o.nextAtFront) {
                methods._appendItem.call(this, o.currentPage + 1, {text: o.nextText, classes: 'next'});
            }
        },

        _getPages: function(o) {
            return  !o.items ? 1 : o.scroll ? o.items.length-o.itemsOnPage+1 : Math.ceil(o.items.length * 1.0 / o.itemsOnPage) ? Math.ceil(o.items.length * 1.0 / o.itemsOnPage) : 1;
        },

        _getInterval: function(o) {
            return {
                start: Math.ceil(o.currentPage > o.halfDisplayed ? Math.max(Math.min(o.currentPage - o.halfDisplayed, (o.pages - o.displayedPages)), 0) : 0),
                end: Math.ceil(o.currentPage > o.halfDisplayed ? Math.min(o.currentPage + o.halfDisplayed, o.pages) : Math.min(o.displayedPages, o.pages))
            };
        },

        _appendItem: function(pageIndex, opts) {
        var self = this, options, $link, o = self.data('pagination'), $linkWrapper = $('<li onclick="console.log(\'click\');this.getElementsByTagName(\'a\')[0].click();"></li>'), $ul = self.find('ul');

            pageIndex = pageIndex < 0 ? 0 : (pageIndex < o.pages ? pageIndex : o.pages - 1);

            options = {
                text: pageIndex + 1,
                classes: ''
            };

            if (o.labelMap.length && o.labelMap[pageIndex]) {
                options.text = o.labelMap[pageIndex];
            }

            options = $.extend(options, opts || {});

            if (pageIndex == o.currentPage || o.disabled) {
                if (o.disabled) {
                    $linkWrapper.addClass('disabled');
                } else {
                    $linkWrapper.addClass('active');
                }
                $link = $('<span class="current">' + (options.text) + '</span>');
            } else {
                $link = $('<a href="' + o.hrefTextPrefix + (pageIndex + 1) + o.hrefTextSuffix + '" class="page-link">' + (options.text) + '</a>');
                $link.click(function(event){
                    return methods._selectPage.call(self, pageIndex, event);
                });
            }

            if (options.classes) {
                $link.addClass(options.classes);
            }

            $linkWrapper.append($link);

            if ($ul.length) {
                $ul.append($linkWrapper);
            } else {
                self.append($linkWrapper);
            }
        },

        _selectPage: function(pageIndex, event) {
            var o = this.data('pagination');
            if (o.items) {
                var start_hide_index, end_hide_index, start_show_index, end_show_index;
                if(o.scroll){
                    start_hide_index = o.currentPage;
                    end_hide_index = o.currentPage + o.itemsOnPage;
                    start_show_index = pageIndex;
                    end_show_index = pageIndex + o.itemsOnPage;
                }
                else{
                    start_hide_index = o.currentPage*o.itemsOnPage;
                    end_hide_index = (o.currentPage+1)*o.itemsOnPage;
                    start_show_index = pageIndex*o.itemsOnPage;
                    end_show_index = (pageIndex+1)*o.itemsOnPage;

                }
                if(Object.prototype.toString.call( o.items ) === '[object Array]'){
            for(item in o.items) {
            o.items[item].removeClass('table-row-visible').hide();
            }
                    if (o.pages == pageIndex)
                        o.items.slice(start_show_index).forEach(function(element){
                            element.addClass('table-row-visible').css('display',o.display)
                        });
                    else
                        o.items.slice(start_show_index, end_show_index).forEach(function(element){
                            element.addClass('table-row-visible').css('display',o.display)
                        });
                }
                else{
            o.items.removeClass('table-row-visible').hide();
                    if (o.pages == pageIndex)
                        o.items.slice(start_show_index).addClass('table-row-visible').css('display',o.display);
                    else
                        o.items.slice(start_show_index, end_show_index).addClass('table-row-visible').css('display',o.display);
                }
                start_hide_index = end_hide_index = start_show_index = end_show_index = null;
            }
            o.currentPage = pageIndex;
            if (o.selectOnClick) {
                methods._draw.call(this);
            }
            return o.onPageClick(pageIndex + 1, event);
        }

    };

    $.fn.page_it = function(method) {

        // Method calling logic
        if (methods[method] && method.charAt(0) != '_') {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.pagination');
        }

    };

})(jQuery);
