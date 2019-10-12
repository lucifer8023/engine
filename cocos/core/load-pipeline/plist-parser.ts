/*
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
 * @category loader
 */

/**
 * A SAX Parser
 * @class saxParser
 */
class SAXParser {
    private _isSupportDOMParser;
    private _parser;
    constructor () {
        if (!(CC_EDITOR && Editor.isMainProcess) && window.DOMParser) {
            this._isSupportDOMParser = true;
            this._parser = new DOMParser();
        } else {
            this._isSupportDOMParser = false;
            this._parser = null;
        }
    }

    /**
     * @method parse
     * @param {String} xmlTxt
     * @return {Document}
     */
    parse (xmlTxt){
        return this._parseXML(xmlTxt);
    }

    _parseXML (textxml) {
        // get a reference to the requested corresponding xml file
        let xmlDoc;
        if (this._isSupportDOMParser) {
            xmlDoc = this._parser.parseFromString(textxml, "text/xml");
        } else {
            // Internet Explorer (untested!)
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(textxml);
        }
        return xmlDoc;
    }
}

/**
 *
 * cc.plistParser is a singleton object for parsing plist files
 * @class plistParser
 * @extends SAXParser
 */
class PlistParser extends SAXParser {
    /**
     * @en parse a xml string as plist object.
     * @zh 将xml字符串解析为plist对象。
     * @param {String} xmlTxt - plist xml contents
     * @return {*} plist object
     */
    parse (xmlTxt) {
        let xmlDoc = this._parseXML(xmlTxt);
        let plist = xmlDoc.documentElement;
        if (plist.tagName !== 'plist') {
            cc.warnID(5100);
            return {};
        }

        // Get first real node
        let node = null;
        for (let i = 0, len = plist.childNodes.length; i < len; i++) {
            node = plist.childNodes[i];
            // @ts-ignore
            if (node.nodeType === 1)
                break;
        }
        xmlDoc = null;
        return this._parseNode(node);
    }

    _parseNode (node) {
        let data:any = null, tagName = node.tagName;
        if(tagName === "dict"){
            data = this._parseDict(node);
        }else if(tagName === "array"){
            data = this._parseArray(node);
        }else if(tagName === "string"){
            if (node.childNodes.length === 1)
                data = node.firstChild.nodeValue;
            else {
                //handle Firefox's 4KB nodeValue limit
                data = "";
                for (let i = 0; i < node.childNodes.length; i++)
                    data += node.childNodes[i].nodeValue;
            }
        }else if(tagName === "false"){
            data = false;
        }else if(tagName === "true"){
            data = true;
        }else if(tagName === "real"){
            data = parseFloat(node.firstChild.nodeValue);
        }else if(tagName === "integer"){
            data = parseInt(node.firstChild.nodeValue, 10);
        }
        return data;
    }

    _parseArray (node) {
        let data:Array<any> = [];
        for (let i = 0, len = node.childNodes.length; i < len; i++) {
            let child = node.childNodes[i];
            if (child.nodeType !== 1)
                continue;
            data.push(this._parseNode(child));
        }
        return data;
    }

    _parseDict (node) {
        let data = {};
        let key = null;
        for (let i = 0, len = node.childNodes.length; i < len; i++) {
            let child = node.childNodes[i];
            if (child.nodeType !== 1)
                continue;

            // Grab the key, next noe should be the value
            if (child.tagName === 'key')
                key = child.firstChild.nodeValue;
            else
                // @ts-ignore
                data[key] = this._parseNode(child);                 // Parse the value node
        }
        return data;
    }
}

/**
 * @type {PlistParser}
 * @name plistParser
 * A Plist Parser
 */
let plistParser = new PlistParser();

export default plistParser;