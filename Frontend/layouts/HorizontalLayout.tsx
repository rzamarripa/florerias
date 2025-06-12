'use client'
import { Fragment } from "react";
import Topbar from "@/layouts/components/topbar";
import { ChildrenType } from "@/types";


const HorizontalLayout = ({ children }: ChildrenType) => {
    return (
        <Fragment>
            <div className="wrapper">
                <Topbar />
                <div className="content-page">
                    {children}
                </div>
            </div>
        </Fragment>
    )
}

export default HorizontalLayout