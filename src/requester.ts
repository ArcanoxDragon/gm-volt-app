import {
    IRequester,
    RequesterOptions,
    StringTable
    } from "gm-volt";

import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse
    } from "axios";

import * as cookieParser from "set-cookie-parser";
import * as qs from "qs";
import * as zlib from "zlib";

function deflate( data: any ) {
    return new Promise<Buffer>( ( res, rej ) => {
        zlib.deflate( data, ( err, result ) => {
            if ( err ) return rej( err );
            return res( result );
        } );
    } );
}

function gunzip( data: any ) {
    return new Promise<Buffer>( ( res, rej ) => {
        zlib.gunzip( data, ( err, result ) => {
            if ( err ) return rej( err );
            return res( result );
        } );
    } );
}

const fixCookieRegex = /;[ ]?expires=([a-z]{3}, [^,]+)/gi;
function fixCookieHeader( header: string ): string {
    return header.replace( fixCookieRegex, "" );
}

export class Requester implements IRequester {
    private axios: AxiosInstance;
    private readonly cookies: StringTable;

    constructor() {
        this.cookies = {};
        this.axios = axios.create( {
            responseType: "arraybuffer",
            withCredentials: true
        } );
    }

    // #region Public

    setDefaultOptions( opts: RequesterOptions ) {
        this.axios = axios.create( {
            baseURL: opts.baseUrl,
            headers: opts.headers,
            responseType: "arraybuffer",
            withCredentials: true
        } );
    }

    get( url: string, opts?: RequesterOptions ): Promise<string> {
        return this.doRequest( url, "get", opts );
    }

    postForm( url: string, form: StringTable, opts?: RequesterOptions ): Promise<string> {
        return this.doRequest( url, "post", opts, form );
    }

    getCookie( url: string, name: string ): string {
        if ( this.cookies[ name ] ) return this.cookies[ name ];

        return null;
    }

    // #endregion Public

    // #region Private

    private handleCookies( res: AxiosResponse ) {
        let header = res.headers[ "set-cookie" ];

        if ( header ) {
            header = fixCookieHeader( header ).split( /,[ ]?/ );
            let cookies = cookieParser.parse( header );

            for ( let cookie of cookies ) {
                this.cookies[ cookie.name ] = cookie.value;
            }
        }
    }

    private async doRequest( url: string, method: string, opts?: RequesterOptions, form?: StringTable ): Promise<string> {
        let axiosOpts: AxiosRequestConfig = { url, method };

        if ( opts ) {
            if ( opts.qs ) axiosOpts.params = opts.qs;
        }

        if ( form ) axiosOpts.data = qs.stringify( form );

        let cookieHeader = Object.keys( this.cookies ).map( name => {
            let val = this.cookies[ name ];
            return `${ name }=${ val }`;
        } ).join( "; " );

        axiosOpts.headers = {
            "Cookies": cookieHeader
        };

        let resp = await this.axios.request( axiosOpts );
        let encoding = resp.headers[ "content-encoding" ];
        let buffer = new Buffer( resp.data );
        let decoded: string;

        this.handleCookies( resp );

        if ( encoding === "gzip" )
            decoded = ( await gunzip( buffer ) ).toString();
        else if ( encoding === "deflate" )
            decoded = ( await deflate( buffer ) ).toString();
        else decoded = buffer.toString();

        return decoded;
    }

    // #endregion Private
}