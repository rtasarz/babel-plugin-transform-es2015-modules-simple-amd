"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_ref) {
	var t = _ref.types;


	return {
		visitor: {
			Program: {
				exit: function exit(path, file) {
					var body = path.get("body"),
					    sources = [],
					    anonymousSources = [],
					    vars = [],
					    namedImports = [],
					    isModular = false,
					    middleDefaultExportID = false;

					for (var i = 0; i < body.length; i++) {
						var _path = body[i],
						    isLast = i == body.length - 1;

						if (_path.isExportDefaultDeclaration()) {
							var declaration = _path.get("declaration");

							if (isLast) {
								_path.replaceWith(t.returnStatement(declaration.node));
							} else {
								middleDefaultExportID = _path.scope.generateUidIdentifier("export_default");
								_path.replaceWith(t.variableDeclaration('var', [t.variableDeclarator(middleDefaultExportID, declaration.node)]));
							}

							isModular = true;
						}

						if (_path.isImportDeclaration()) {
							var specifiers = _path.node.specifiers;

							if (specifiers.length == 0) {
								anonymousSources.push(_path.node.source);
							} else if (specifiers.length == 1 && specifiers[0].type == 'ImportDefaultSpecifier') {
								sources.push(_path.node.source);
								vars.push(specifiers[0]);
							} else {
								(function () {
									var importedID = _path.scope.generateUidIdentifier(_path.node.source.value);
									sources.push(_path.node.source);
									vars.push(importedID);

									specifiers.forEach(function (_ref2) {
										var imported = _ref2.imported,
										    local = _ref2.local;

										namedImports.push(t.variableDeclaration("var", [t.variableDeclarator(t.identifier(local.name), t.identifier(importedID.name + '.' + imported.name))]));
									});
								})();
							}

							_path.remove();

							isModular = true;
						}

						if (isLast && middleDefaultExportID) {
							_path.insertAfter(t.returnStatement(middleDefaultExportID));
						}
					}

					if (isModular) {
						path.node.body = [buildModule({
							IMPORT_PATHS: sources.concat(anonymousSources),
							IMPORT_VARS: vars,
							BODY: path.node.body,
							NAMED_IMPORTS: namedImports
						})];
					}
				}
			}
		}
	};
};

require("better-log/install");

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buildModule = (0, _babelTemplate2.default)("\ndefine(['require', IMPORT_PATHS], function(require, IMPORT_VARS) {\n\tNAMED_IMPORTS;\n\tBODY;\n});\n");

;