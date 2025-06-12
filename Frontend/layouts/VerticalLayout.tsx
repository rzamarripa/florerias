import { Fragment } from "react";
import Sidenav from "@/layouts/components/sidenav";

import { ChildrenType } from "@/types";

const VerticalLayout = ({ children }: ChildrenType) => {

    return (
        <Fragment>
            <div className="wrapper">
                <Sidenav />
                <div className="content-page">
                    {children}
                </div>
            </div>
        </Fragment>
    )
}

export default VerticalLayout