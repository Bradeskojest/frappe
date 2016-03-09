frappe.pages['modules'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Modules',
		single_column: false
	});

	frappe.modules_page = page;
	page.section_data = {};

	page.wrapper.find('.page-head h1').css({'padding-left': '15px'});
	// page.wrapper.find('.page-content').css({'margin-top': '0px'});

	// render sidebar
	page.sidebar.html(frappe.render_template('modules_sidebar', {modules: frappe.get_desktop_icons()}));

	page.activate_link = function(link) {
		page.wrapper.find('.module-sidebar-item.active, .module-link.active').removeClass('active');
		$(link).addClass('active').parent().addClass("active");
		show_section($(link).attr('data-name'));
	}

	page.add_menu_item(__("Hide this section"), function() {
		frappe.call({
			method: "frappe.desk.moduleview.hide_module",
			args: {
				module: frappe.get_route()[1]
			},
			callback: function() {
				frappe.set_route('modules', page.wrapper.find('.module-link:first').attr('data-name'));
				window.location.reload();
			}
		})
	});

	page.add_menu_item(__("Settings"), function() {
		frappe.route_options = {
			"user": user
		};
		frappe.set_route("modules_setup");
	});


	var show_section = function(module_name) {
		if(module_name in page.section_data) {
			render_section(page.section_data[module_name]);
		} else {
			page.main.empty();
			return frappe.call({
				method: "frappe.desk.moduleview.get",
				args: {
					module: module_name
				},
				callback: function(r) {
					m = frappe.get_module(module_name);
					m.data = r.message.data;
					process_data(m.data);
					page.section_data[module_name] = m;
					render_section(m);
				},
				freeze: true,
			});
		}

	}

	var render_section = function(m) {
		page.set_title(__(m.label));
		page.main.html(frappe.render_template('modules_section', m));

		if(frappe.utils.is_mobile()) {
			$(document).scrollTop($('.module-body').offset().top - 100);
		}

		//setup_section_toggle();
		frappe.app.update_notification_count_in_modules();

		page.main.find('.module-section-link').on("click", function(event) {
			// if clicked on open notification!
			if (event.target.classList.contains("open-notification")) {
				var doctype = event.target.getAttribute("data-doctype");
				frappe.route_options = frappe.boot.notification_info.conditions[doctype];
				return false;
			}
			if($(this).attr("data-type")==="help") {
				frappe.help.show_video($(this).attr("data-youtube-id"));
				return false;
			}
		});

	}

	var process_data = function(data) {
		data.forEach(function(section) {
			section.items.forEach(function(item) {
				item.style = '';
				if(item.type==="doctype") {
					item.doctype = item.name;
				}
				if(!item.route) {
					if(item.link) {
						item.route=strip(item.link, "#")
					}
					else if(item.type==="doctype") {
						item.route="List/" + item.doctype
						item.style = 'text-decoration: underline;';
						// item.style = 'font-weight: bold;';
					}
					else if(item.type==="report" && item.is_query_report) {
						item.route="query-report/" + item.name
					}
					else if(item.type==="report") {
						item.route="Report/" + item.doctype + "/" + item.name
					}
					else if(item.type==="page") {
						item.route=item.name;
					}
				}

				if(item.route_options) {
					item.route += "?" + $.map(item.route_options, function(value, key) {
						return encodeURIComponent(key) + "=" + encodeURIComponent(value) }).join('&')
				}

				if(item.type==="page" || item.type==="help" ||
					(item.doctype && frappe.model.can_read(item.doctype))) {
						item.shown = true;
				}

			});
		});
	}
}

frappe.pages['modules'].on_page_show = function(wrapper) {
	var route = frappe.get_route();
	if(route.length > 1) {
		var link = frappe.modules_page.sidebar.find('.module-link[data-name="'+ route[1] +'"]');
		frappe.modules_page.activate_link(link);
	}
}

