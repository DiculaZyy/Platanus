export interface Point {
    x : number;
    y : number;
}

export interface Area {
    width : number;
    height : number;
}

export interface Rect extends Point, Area {

}

export interface Node extends Rect {
    name : string;
    id : string;
}