.PHONY: openapi-export openapi-export-yaml openapi-validate openapi

openapi-export:
	python manage.py spectacular --file openapi/openapi.json --format openapi-json

openapi-export-yaml:
	python manage.py spectacular --file openapi/openapi.yaml --format openapi-yaml

openapi-validate:
	python -m json.tool openapi/openapi.json > /dev/null

openapi: openapi-export openapi-validate
	cd openapi && npm run gen:types && npm run check:types
