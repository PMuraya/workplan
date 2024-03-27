<?php
//
//Get the directory from where this file was launched form
$cwd = dirname($_SERVER['SCRIPT_NAME']);
?>

<!DOCTYPE html> 
<!--
Demosttaing the zone idea using school exam data
-->
<html>
    <head>
        <title>Sample Tests</title>
        <link rel="stylesheet" href="workplan.css">
        <!--
        The markdown library-->
        <!--script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script-->
        <script src=https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js ></script>
        
        <script type="module">
            //
            //Start the examp page 
            import {workplan, get_base_sql} from "./workplan.js";
            //
            //
            //On loading the sample page....
            window.onload = async()=>{
                //
                //Get the base sql
                const sql = await get_base_sql(<?php echo '"'.$cwd.'"'?>);
                //
                //Create an exam page
                const page = new workplan(sql,<?php echo '"'.$cwd.'"'?>);
                //
                //Show the 5th sitting
                await page.show();
                //
                //Expose the page
                window.page = page;
            };

        </script>
    </head>

    <body>
        <!--The sections of my page -->
        <div id="menu">
            <label>
                Who are You?
                <select id="contributor">
                    <option>muraya</option>
                    <option>karen</option>
                    <option>muli</option>
                    <option>mogaka</option>
                    <option>elias</option>
                    <option>karanja</option>
                </select>
            </label>

            <button>Record Sound</button>
            <button>Take Photo</button>
            <!--
                Nothing attached to this button; it is simply provided here so 
                that we can lose fous-->
            <button>Save</button>
            <button onclick="page.view_toggle_projector(this)">Toggle Projector</button>
            <button onclick="page.detail_toggle()">Toggle Markdown</button>
        </div>
        <div id="presentation"></div>
        <div id="contribution"></div>
        <div id="detail">
            <textarea id="textarea"></textarea>
            <div id="markdown" hidden></div>
        </div>
        
    </body>
</html>