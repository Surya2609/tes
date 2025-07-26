### App Versions
```
{
	"erpnext": "15.50.0",
	"frappe": "15.54.1",
	"hrms": "16.0.0-dev",
	"india_compliance": "15.15.0",
	"payments": "0.0.1",
	"webshop": "0.0.1"
}
```
### Route
```
query-report/kot ganga test
```
### Traceback
```
Traceback (most recent call last):
  File "apps/frappe/frappe/app.py", line 114, in application
    response = frappe.api.handle(request)
  File "apps/frappe/frappe/api/__init__.py", line 49, in handle
    data = endpoint(**arguments)
  File "apps/frappe/frappe/api/v1.py", line 36, in handle_rpc_call
    return frappe.handler.handle()
  File "apps/frappe/frappe/handler.py", line 50, in handle
    data = execute_cmd(cmd)
  File "apps/frappe/frappe/handler.py", line 86, in execute_cmd
    return frappe.call(method, **frappe.form_dict)
  File "apps/frappe/frappe/__init__.py", line 1726, in call
    return fn(*args, **newargs)
  File "apps/frappe/frappe/utils/typing_validations.py", line 31, in wrapper
    return func(*args, **kwargs)
  File "apps/frappe/frappe/__init__.py", line 879, in wrapper_fn
    retval = fn(*args, **get_newargs(fn, kwargs))
  File "apps/frappe/frappe/desk/query_report.py", line 224, in run
    result = generate_report_result(report, filters, user, custom_columns, is_tree, parent_field)
  File "apps/frappe/frappe/__init__.py", line 879, in wrapper_fn
    retval = fn(*args, **get_newargs(fn, kwargs))
  File "apps/frappe/frappe/desk/query_report.py", line 84, in generate_report_result
    res = get_report_result(report, filters) or []
  File "apps/frappe/frappe/desk/query_report.py", line 65, in get_report_result
    res = report.execute_script_report(filters)
  File "apps/frappe/frappe/core/doctype/report/report.py", line 172, in execute_script_report
    res = self.execute_module(filters)
  File "apps/frappe/frappe/core/doctype/report/report.py", line 187, in execute_module
    return frappe.get_attr(method_name)(frappe._dict(filters))
  File "apps/erpnext/erpnext/selling/report/kot_ganga_test/kot_ganga_test.py", line 329, in execute
    return columns, raw_data, message
UnboundLocalError: local variable 'message' referenced before assignment

```
### Request Data
```
{
	"type": "GET",
	"args": {
		"report_name": "kot ganga test",
		"filters": "{}",
		"ignore_prepared_report": false,
		"are_default_filters": true
	},
	"headers": {},
	"error_handlers": {},
	"url": "/api/method/frappe.desk.query_report.run",
	"request_id": null
}
```
### Response Data
```
{
	"exception": "UnboundLocalError: local variable 'message' referenced before assignment",
	"exc_type": "UnboundLocalError",
	"_exc_source": "erpnext (app)"
}
```