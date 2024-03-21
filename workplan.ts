/*Tabulating a presentation. 
Concepts
    - driver_source/matrix, array
*/
import {basic_value, mutall_error, fuel} from "../../../schema/v/code/schema.js";
import {view} from "../../../outlook/v/code/outlook.js";
import {label} from '../../../schema/v/code/questionnaire.js';
import {exec} from '../../../schema/v/code/server.js'

import {zone, homozone, heterozone, driver_source, glade, cell, cell_value, obj
} from "../../../outlook/v/code/zone.js";

import {myalert} from '../../../outlook/v/code/view.js';

//The code for the marked function is brought in here via teh contemt deliverly 
//network, CDN. This requires access to the internet. The alternative method is
//via the node_module library; this is where we would need to use WebPack! 
//Otherwise our code would compile but not run
declare const marked:{parse(input:string):string}  

//The cell onclick event
type onclick = (cell:cell)=>void;

//Define the data collecte by the conribution homozone
interface contribution extends cell_value{

    //Contribution primary key
    pk:number;
    //
    //The summary text
    summary:string;
    //
    //The detail text
    detail:string;
} 

export async function get_base_sql(cwd:string):Promise<string>{
    //
    //Define the path to the sql. NB. The path is relative to the cwd
    const path:string = 'workplan.sql';
    //
    //The path is a file
    const is_file:boolean=true;
    //
    //Let the server add the root to complete the path
    const add_root:boolean = true;
    //
    //Get the sql statement
    const sql:string = await exec('path',[path, is_file, add_root], 'get_file_contents', [], cwd);
     //
     return sql;
} 
        
//
export class workplan extends view{

    //reating the date homozone requires access to the database
    public date?:homozone;
    //
    //The activity, minute and contribution homozones
    public activity:homozone;
    //
    //The current presentation
    public presentation:homozone;
    //
    //These homozones depend on the user selection
    public minute?:homozone;
    public contribution_body?:homozone;
    //
    //The text area element
    public textarea:HTMLTextAreaElement;
    //
    //The cell that is the target of the textaera input. Try to respore this
    //ce when we restart this app.
    public cell?:cell;
    
    //The interns
    public contributor:HTMLSelectElement;
    //
    //Numbers for indexingminutes and contributions 
    public static nums:Array<string> = [ '1','2','3', '4','5', '6', '7','8','9','10'];
    //
    //A zone for holding hidden primary keys associated with an activity
    public activity_hidden:homozone;
    //
    public presentation_heterozone?:heterozone;
    public contribution_heterozone?:heterozone;
    
    //NB. The current working directory (cwd) is used for resolving relative 
    //paths. 
    constructor(public base_cte:string, public cwd:string){
        super();
         //
        //Set set the activity homozone
        this.activity = this.activity_create();
        //
        //Set the presentation matrix zone
        this.presentation = this.presentation_create();
        //
        //Add the onblur event to the textarea
        this.textarea = <HTMLTextAreaElement>this.get_element('textarea');
        this.textarea.onblur = async()=>await this.textarea_onblur();     
        
        this.contributor = <HTMLSelectElement>this.get_element('contributor');
        //
        this.activity_hidden=this.activity_hidden_create();
    }

    //Togg
    view_toggle_projector(button:HTMLButtonElement):void{
        //
        //Toggle the button using class projector
        button.classList.toggle('projector');
        //
        //If in project or mode use large font for all displays; otherwise use 
        //the small font
        const fontsize:string = button.classList.contains('projector') ? 'large': 'small';
        //
        //Compile the a css rule to achieve the above
        const rule:string = `*{font-size:${fontsize}}`;
        //
        //Add the rule to the workplan.css
        this.view_add_css_rule(rule);  
    }

    // Adds a new CSS rule to the stylesheet.
    // Example of 'h2 { font-size: 24px; color: blue; }'
    view_add_css_rule(new_rule: string): void {
        //
        // Find the <link> element referencing workplan.css
        const link_element: HTMLLinkElement | null = document.querySelector('link[href="workplan.css"]');
        //
        // Add the new rule to the stylesheet
        if (link_element) {
            //
            // Retrieve the stylesheet object associated with the <link> element
            const stylesheet: CSSStyleSheet | null = link_element.sheet;
            //
            // Check if the stylesheet object exists
            if (stylesheet) {
                //
                // Insert the new CSS rule at the end of the existing rules
                stylesheet.insertRule(new_rule, stylesheet.cssRules.length);
            } else {
                //
                // Log an error if the stylesheet object is not accessible
                console.error('StyleSheet is not accessible.');
            }
        } else {
            // Log an error if the <link> element referencing workplan.css is not found
            console.error('Link element to workplan.css not found.');
        }
    }
    
    //On blur save the contents of the text area to the correct homozone and 
    //database field
    async textarea_onblur():Promise<void>{
        //
        //Get the textarea cell
        const cell:cell|undefined = this.cell;
        //
        //The cell must be defined
        if (!cell) throw new mutall_error(`Text area not linked to any cell`);
        //
        //Continue only if there is real change
        if (!(this.textarea.value && this.textarea.value!==(<contribution>cell.value).detail)) return;
        //
        //Collect the appropriate labels
        const labels:Array<label> = [...this.textarea_collect_labels(cell)];
        //
        //Save the collection 
        const result:string = await exec(
            'questionnaire', ['tracker_mogaka'], 'load_common', [labels]
        );
        if (result!=='ok') throw new mutall_error(result);
        //
        //Save the text area content as a detail, assuming the cell value is
        //the contribution extension
        (<contribution>cell.value).detail = this.textarea.value;
            
    }

    //Collect labels associated with a text area. The given cell is the one
    //linked to the text area
    *textarea_collect_labels(cell:cell):Generator<label>{
        //
        //Get the text area value
        const value:string = this.textarea.value;
        //
        //Get the homozone that is a parent of the given cell
        const zone:homozone = cell.parent;
        //
        //The required labels depend on the zone in which the cell is located
        switch(zone){
            //
            //Collect the contribution
            case this.contribution_body:
                yield [value, 'contribution', 'detail', ['contributor']];
                yield *this.contribution_body_collect(cell);
                break;
            case this.minute:
                yield [value, 'minute', 'detail'];
                yield *this.minute_collect(cell);
                break;
            //
            //In the activity zone, the labels depend on the cell's column index which
            //spell out field names
            case this.activity:
                //
                //Get the activity cell
                const acell:cell = this.activity.cell!
                //
                //Get the column field name indxec
                const fname:string = acell.index[1];
                //
                //Get the activity row index
                const activity:string = acell.index[0];
                //
                //Note intern_surname has no details
                switch(fname){
                    case 'project_summary':
                        yield [value, 'project', 'detail'];
                        //
                        //Get the project primary key
                        const project:basic_value = this.activity_hidden.cells[activity]['project'].value.value 
                        yield [project, 'project', 'project'];
                        break;
                    case 'activity_summary':
                        yield [value, 'activity', 'detail'];
                        yield [activity, 'activity', 'activity'];
                        break;
                    default:
                        throw new mutall_error(`Unable to collect details for col '${fname}' in zone '${zone.id}'`);                
                }
                break;
            default:
                throw new mutall_error(`Unable to collect labels from zone '${zone.id}'`);
        }
    }

     //Create the contribution body zone, so completly that we can deduce the
     //header and leftie homozones
    contribution_body_create(activity:string, date:string):homozone{
        //
        //Formulate sql for retrieving contributions
        const sql:string = `
            select
                minute.num as minute,
                contribution.num,
                json_object('value', contribution.summary, 'detail', contribution.detail) as cell_value
            from
                contribution
                inner join minute on contribution.minute = minute.minute
                inner join presentation on minute.presentation = presentation.presentation
                inner join activity on presentation.activity = activity.activity
                inner join intern on contribution.intern = intern.intern
            where
                activity.activity='${activity}'
                and presentation.date='${date}'
                #
                # limit contribution to those of intern logged in
                and intern.surname ='${this.contributor.value}'
        `
        //
        //Define the data source for the contribution
        const driver_source:driver_source = {
            type: 'sql.long',
            sql,
            row:'minute',
            col:'num',
            cell_value:'cell_value',
            dbname:'tracker_mogaka'
        }
        //
        //Create the contribution body homozone
        const zone = new homozone({
            //
            //My local identifier
            id:'contribution_body',
            //
            //The source of the row and column axes is the 10 x 10 list of numbers
            axes_source:[workplan.nums, workplan.nums],
            //
            //Clicking on a cell will link it to the textarea 
            onclick:(cell:cell)=>this.cell_onclick(cell),
            //
            // Put some limits on field size
            io_type:{type:'text', maxlength:8, size:8},
            //
            //Here's the driver (data) source
            driver_source,
            //
            //On blur, save the current contribution
            onblur:async (cell:cell)=>await this.cell_onblur(cell)
        });
        //
        return zone;
    }

    //Returns the the minute summary from the io of the minute in the current
    //context 
    minute_get_summary():basic_value|undefined{
        //
        //Get the current row index, via the the row index of the controbution_body
        //homozone. Tthat should return a num index
        const row_num:string|undefined = this.contribution_heterozone?.cell?.index[0];
        //
        //Proceed only if this index is defined
        if (!row_num) return undefined;
        //
        //The value come from the current row and minute column of the minute homozone
        const cell:cell|undefined = this.minute?.cells[row_num]['minute'];
        //
        if (!cell) return undefined;
        //
        //Get the cell value
        const value:basic_value = cell.io.value;
        //
        return value;
    }

     //Collect the minute-specific labels
    *minute_collect(cell:cell):Generator<label>{
        //
        //Get the row index of the minute, the num
        const num:string = cell.index[0];
        //
        //Collect the minute number; 
        yield [num, 'minute', 'num'];
        //
        //Yield a question mark if the summary is empty
        yield [this.minute_get_summary() ?? '?', 'minute', 'summary'];
        //
        //Collect  the presenter from the presentation_heterozone; the value 
        //comes from the activity_hidden homozone under the 'activity' indexs.
        const activity:string|undefined = this.presentation_heterozone?.cell?.index[0];
        //
        //Its an error if the activity is not defined
        if (!activity) throw new mutall_error(`No activity found in the presentation heterozone`);
        //
        //Get the presenter's primary key
        const presenter:basic_value = this.activity_hidden.cells[activity]['intern'].value.value;
        //
        yield[presenter, 'intern', 'intern'];
        //
        //Collect theh activity
        yield[activity, 'activity', 'activity'];
        //
        //Get teh presentation date
        const date:string|undefined = this.presentation_heterozone?.cell?.index[1];
        //
        //The date of presentation must be defoned
        if (!date) throw new mutall_error(`Presentation date not found`);
        //
        //Compile the date value from the column index of the date homozone
        yield [date, 'presentation', 'date'];
        
    }

    //Collect the contribution summary of the intern who is logged in
    *contribution_body_collect(cell:cell):Generator<label>{
        //
        //Get the contribution number; it is the cell's column index
        const col:string = cell.index[1];
        yield [col, 'contribution', 'num', ['contributor']];
        //
        //The contribution summary comes from the cell's value
        const summary:basic_value = cell.io.value;
        //
        //Use mark with a questionmark a summary that is  empty
        if (summary) yield [summary ?? '?', 'contribution', 'summary', ['contributor']];
        //
        //The contributor is logged in
        yield [this.contributor.value, 'intern', 'surname', ['contributor']];
        //
        //Get the minute cell; 
        const mincell:cell|undefined = this.minute?.cells[cell.index[0]]['minute'];
        //
        //It must be  defined
        if (!mincell) throw new mutall_error(`Minute cell not found`);
        //
        //Collect the minute
        yield *this.minute_collect(mincell);
    }


    //Collect presentation related data guided by the data model
    *presentation_collect():Generator<label>{
        //
        //Get the row index of the current selection in the presentation homozone.
        //It represents the activity primary keys There may not be a selected
        //cell
        const activity:string|undefined = this.presentation?.cell?.index[0];
        //
        //Discontinue if the activity row cannot be found
        if (!activity) return;
        //
        //The presentation is indexed by activity primary keys
        yield [activity, 'activity', 'activity']
        //
        //Get the date column index that matches the row index 
        const date:string|undefined = this.presentation?.cell?.index[1];
        //
        //It is an error if the column index is not found
        if (!date) throw new mutall_error(`A column index must be defined if a matching row is`);
        //
        //Compile the date value from the column index of the date homozone
        yield [date, 'presentation', 'date', ['presenter']];
        
    }
    
    //Show this workplan
    async show():Promise<void>{
        //
        this.presentation_heterozone = await this.presentation_heterozone_create();
        //
        //Show the presentation heterozone
        await this.presentation_heterozone.show();
        //
        //Select the cell of this heterozone, i.e., as the first cell in the 
        //activity
        this.presentation_heterozone.cell = this.presentation_heterozone_get_cell();
    }
    
    //Create the presentation heterozone demarcated by the activity by  
    //date homozones
    async presentation_heterozone_create():Promise<heterozone>{
        //
        //Create a hidden glade-like homozone in the first index of the 
        //heterozone
        const glade=new homozone({oncell_create:(cell)=>cell.td.style.display='none'});
        //
        //Compile the layout of the activity by date heterozone
        const layout:Array<Array<zone>> = [
            [glade, new homozone(), this.date= await this.date_create()],
            [this.activity_hidden, this.activity, this.presentation],
        ];
        //
        //Create the heterozone attached to the presentation panel
        const hetero = new heterozone(layout, '#presentation');
        //
        return hetero;
    }

    //Get, click and return the cell for a heterozone 
    presentation_heterozone_get_cell():cell{
        //
        //Get the first row index in the activities homozone
        const activity:string|undefined = this.activity.axes[0]![0];
        //
        //The first row index must exist
        if (!activity) throw new mutall_error(`There is no first activity zone`);
        //
        //Get today's date
        const date:string =this.get_today_date(); 
        //
        //Get the activity/date indexed cell of the presentation zone
        const cell:cell|undefined = this.presentation.cells[activity][date];
        //
        //Its an error if the cell is not found
        if (!cell) throw new mutall_error(`No cell is found at this index, '[${activity}, ${date}]' of the activity`);
        //
        //Initiate a click event
        //
        //Set the tect area ccell to this one
        this.cell = cell;
        //
        //Manually, execute the cell onclik function
        this.cell_onclick(cell);
        //
        //Execute the onclick event handlers attached to the cell's td
        cell.td.click();
        //
        return cell;
    }    

    //Returns today's date
    get_today_date():string {
        //
        // Create a new Date object
        const today = new Date();
        //
        // Extract year, month, and day
        const year = today.getFullYear();
        //
        // JavaScript months are zero-based, so January is 0, February is 1, and so on.
        const month = today.getMonth() + 1; // Adding 1 to get the correct month
        const day = today.getDate();
        //
        // Format the date as YYYY-MM-DD
        const formatted_date = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
        //
        // Return the formatted date
        return formatted_date;
    }
    
    //Returns The hidden activity holding keys for activiy,project and intern
    activity_hidden_create():homozone{
        //
        //Formulate sql for retrieving contributions
        const sql:string = `
            select 
                activity.activity,
                intern.intern,
                project.project
            from 
                project
                inner join workplan on project.workplan = workplan.workplan
                inner join intern on workplan.intern = intern.intern
                inner join activity on activity.project = project.project
            where 
                workplan.year=2024
            order by 
                intern.surname,
                project.summary, 
                activity.summary
            `
        //
        //Define driver source for this zone
        const driver_source:driver_source = {
            type:'sql.fuel', 
            sql,
            row_index:'activity', 
            dbname:'tracker_mogaka'
        };
        //
        //Create the contribution body homozone
        const zone = new homozone({
            //
            //Here's the driver (data) source
            driver_source,
            //
            //When a cell is created, set its display to none
            oncell_create:(cell)=>cell.td.style.display='none',
        });
        //
        return zone;
    }

    //Save the surname or project or activity summary+detail
    async activity_save(cell:cell):Promise<void>{
        //
        //Collect the necessary cell labels
        const labels:Array<label> = [...this.activity_collect(cell)];
        //
        //Use the labels to save the correspinding data
        const result:string = await exec(
            'questionnaire', ['tracker_mogaka'], 'load_common', [labels],
        );
        //Report errors,if any
        if (result!=='ok') myalert(result);
    }


    //Collect actovity labels
    *activity_collect(cell:cell):Generator<label>{
        //
        //Collect the label that matches the cell's io value, if any
        const value:basic_value = cell.io.value;
        //
        //Discontinue of the value is null
        if (!value) return;
        //
        //Get the row and column axes tick marks that match the cell
        const row:string = cell.index[0];
        const col:string = cell.index[1];
        //
        //Get the database entity and column names that match the column index
        //
        //Compile the matches, starting with an empty object
        const match:{[name:string]:[string, string]} = {};
        //
        //Match column tiks to database entity and colum names
        match['intern_surname'] = ['intern', 'surname'];
        match['project_summary'] = ['project', 'summary'];
        match['activity_summary'] = ['activity', 'summary'];
        //
        //Destructire the match that corresponds to the column index
        const [ename, cname] = match[col];
        //
        //Yield the value label
        yield [value, ename, cname];
        //
        //Yield the primary key label (which has been used for row indexing)
        yield [row, ename, ename];
    }    

    //Create a presentation
    presentation_create():homozone{
        //
        //Compile the sql for construction homozone data
        const sql:string =`
            ${this.base_cte} 
            select * from presentation`;
        //
        //Compile teh driver source
        const driver_source:driver_source = {
            type:'sql.long', 
            sql, 
            row:'activity',
            col:'date',
            cell_value:'cell_value',
            dbname:'tracker_mogaka'
        }
        //
        //Clicking on a presentation cell creates creates and shows controbution 
        //heterozonetable and clears the textarea 
        const onclick:onclick = async (cell)=>{
            //
            //Creates the controbution hetereozone 
            this.contribution_heterozone = await this.contribution_heterozone_create(cell);
            //
            //Show the zone
            await this.contribution_heterozone.show();
            //
            //Clears the text area
            this.textarea.value='';
        };
        //
        //Compile the presentation homozone
        return new homozone({
            //
            id:'presentation',
            //
            onclick,
            driver_source
        });
    }
    
    //Returns the activity homozone
    activity_create():homozone{
        //
        //List the activities as a matrix
        const sql:string =`
            select 
                activity.activity activity_activity,
                intern.surname as intern_surname,
                json_object('value', project.summary, 'detail', project.detail) as project_summary,
                json_object('value', activity.summary, 'detail', activity.detail) as activity_summary
            from 
                project
                inner join workplan on project.workplan = workplan.workplan
                inner join intern on workplan.intern = intern.intern
                inner join activity on activity.project = project.project
            where 
                workplan.year=2024
            order by 
                intern.surname,
                project.summary, 
                activity.summary
        `; 
        //
        //Define a matric driver source
        const driver_source:driver_source = {
            type:'sql.fuel', 
            sql,
            row_index:'activity_activity', 
            dbname:'tracker_mogaka'
        };
        //
        //Define the onclick event
        const onclick:onclick = (cell:cell)=>this.cell_onclick(cell);
        //
        //Use the driver source to create a homozone with a click event
        const zone = new  homozone({
            driver_source, 
            onclick, 
            //
            // Put some limits on field size
            io_type:{type:'text', maxlength:8, size:8},
            //
            //Add autosaving to a cell on losing focus of this activity field
            onblur:async(cell:cell)=>await this.cell_onblur(cell),
            
        });
        //
        return zone;
    }

    //On losing focus from a cell, save the results, e.g., 
    //minute_summary, contribution_summary, activity_summary, project_summary
    //intern_surname
    async cell_onblur(cell:cell):Promise<void>{
        //
        //Save only if there is real change
        if (cell.io.value === cell.value.value) return;
        //
        //Get the parent of this cell
        const zone:homozone = cell.parent;
        //
        //Define a a labels collector
        let labels:Array<label>;
        //
        //The labels depend on the cell's parent homozone
        switch(zone){
            case this.minute: labels = [...this.minute_collect(cell)]; break;
            case this.contribution_body: labels = [...this.contribution_body_collect(cell)];break;
            case this.activity: labels = [...this.activity_collect(cell)]; break;
            default:
                throw new mutall_error(`On blur case missing for zone ${zone.id}`);        
        }
        //
        //Save the collection 
        const result:string = await exec(
            'questionnaire', ['tracker_mogaka'], 'load_common', [labels]
        );
        //
        //Alert only if there is a problem    
        if (result!=='ok') throw new mutall_error(result);
        //
        //Update the cell value
        cell.value.value = cell.io.value;
    }

    //
    //Returns the dates homozone
    async date_create():Promise<homozone>{
        //
        //Define the column axis
        const col_axis:Array<string> = await this.date_get_axis();
        //
        const zone = new  homozone({
            driver_source:{type:'array', array:col_axis, special:true}}
        );    
        //
        return zone;
    };

    //Returns the axis associated with a dates of presentation with a 5-day extension
    async date_get_axis():Promise<Array<string>>{
        //
        //Read and execute the date query from a file
        const result:Array<{date:string}> = await exec(
            'database',
            ['tracker_mogaka', false],
            'get_sql_data',
            ['presentation_dates.sql', 'file'],
            this.cwd
        );
        //
        //Map the resulting objects to strings
        return result.map(x=>x.date);    
    }
    

    //Toggle teh detail panel between a textarea and the markdown view
    detail_toggle():void{
        //
        //Get the current heterozone cell; its value.value.detail contains the
        //most recent textarea text
        const cell:cell|undefined = this.cell;
        //
        //Continue only if there is a current cell for thos heterozone
        if (!cell) return;
        //
        //Get the candidate text (to be marked down or not)
        const candidate:string|undefined = (<contribution>cell.value).detail;
        //
        //Discontinue if there is no text to render
        if (!candidate) return; 
        //
        //Get the detail element
        const detail:HTMLElement = this.get_element('detail');
        //
        //Toggle the 'markdown' class of the detail
        detail.classList.toggle('markdown');
        //
        //Get the markdown rendered view div element
        const markdown:HTMLElement = this.get_element('markdown');
        //
        //Get the textarea element
        const textarea = <HTMLTextAreaElement>this.get_element('textarea'); 
        //
        //If in markdown mode
        if (detail.classList.contains('markdown')){
            //
            //Use the marked library to render it in html
            //
            //Ensure you have internet, othersise you wont reach the CDN where the
            //code is accesed from
            try{
                const html:string = marked.parse(candidate);
                //
                //Put the result in the markdown element
                markdown.innerHTML = html;
                //
                //Show markdown; hide textarea
                markdown.hidden=false; this.textarea.hidden=true
            }catch(err){
                throw new mutall_error('You need internet access to use the marked library') 
            }
        }
        //Else, i.e., in normal mode...
        else{
            //
            //Set the textarea to the candidate text
            textarea.value = candidate;
            //
            //Show textarea; hide markdown
            textarea.hidden = false; markdown.hidden=true
        }    
    } 
            
    //Create andd display the contribution heterozone
    async contribution_heterozone_create(cell:cell):Promise<heterozone>{
        //
        //Make the cell current so that it it becomes the subject of the text area
        this.cell = cell;
        //
        //Clear the contributions panel
        this.get_element('contribution').innerHTML='';
        //
        //Extract the presentation activity and date from the presentation index
        const activity:string = cell.index[0];
        const date:string = cell.index[1];
        //
        //Create teh minutes
        this.minute = this.minute_create(activity, date);
        //
        //Construct the contribution body
        this.contribution_body = this.contribution_body_create(activity, date);
        //
        //Arrange the 6 zones that make up the contribution heterozone
        const layout:Array<Array<zone>> = [
            [new glade(), this.minute.header(), this.contribution_body.header()],
            [this.contribution_body.leftie(), this.minute, this.contribution_body]
        ]; 
        //
        //Create the heterozone of 4 zones attached to the minute panel
        const zone = new heterozone(layout, '#contribution');
        //
        //Return the zone
        return zone;
    }

    //Get, click and return the intercept cell for a contribution zone 
    contribution_heterozone_get_cell():cell{
        //
        //Get the first row index (minute num) in the contribution body homozone
        const min_num:string|undefined = this.contribution_body?.axes[0]![0];
        //
        //The first row index must exist
        if (!min_num) throw new mutall_error(`There is no first minute`);
        //
        //Get the contribution num
        const cont_num:string|undefined = this.contribution_body?.axes[0]![1];
        if (!cont_num) throw new mutall_error(`There is no first contribution`);
        //
        //Get the num by num indexed cell of the presentation zone
        const cell:cell|undefined = this.contribution_body!.cells[min_num][cont_num];
        //
        //Its an error if the cell is not found
        if (!cell) throw new mutall_error(`No cell is found at this index, '[${min_num}, ${cont_num}]' of the contribution`);
        //
        //Initiate a click event
        //
        //Set the tect area ccell to this one
        this.cell = cell;
        //
        //Manually, execute the cell onclik function
        this.cell_onclick(cell);
        //
        //Execute the onclick event handlers attached to the cell's td
        cell.td.click();
        //
        return cell;
    }    


    //On clicking a homozome's cell, update the current/textarea cell, transfer 
    //focus to the cell's io and populate the detail panel with matching detail.
    cell_onclick(cell:cell):void{
        //
        //Update the workplan cell so that it is the subject of the text area input
        this.cell= cell;
        //
        //Let the reference cell of the parent homozone be this cell, 
        this.cell.parent.cell = cell;
        //
        //Let the reference cell of the underlying heterozone zone be this cell
        //NB. The data tyep of a homozone parent is string|{index, zone}
        if (typeof this.cell.parent.parent!=='string') 
            this.cell.parent.parent.zone.cell = cell;
        //
        //Transfer focus to the cells io
        cell.io.focus();
        //
        //Populate the detail panel
        //
        //Transfer the cell detail to the text area, ready for editing
        const detail:string|undefined = (<contribution>cell.value).detail;
        //
        //If the detail panel is in markdown mode...
        if (this.get_element('detail').classList.contains('markdown'))
            // 
            //...then markup the detail and display in the markdown div element
            this.get_element('markdown').innerHTML = marked.parse(detail);
        ///If the detail panel is normal (non-markdown) mode...
        else
            //
            //...then update the text area 
            this.textarea.value = detail??null; 
    }

    //Create the minutes homozone to be part of the contribution homozone
    minute_create(activity:string, date:string):homozone{
        //
        //Formulate the sql for populating minutes with data
        const sql:string = `
            select 
                minute.num,
                json_object('value', minute.summary, 'detail', minute.detail) as minute
            from
                minute
                inner join presentation on minute.presentation = presentation.presentation
                inner join activity on presentation.activity= activity.activity
            where
                activity.activity='${activity}'
                and presentation.date='${date}' 
        `;
        //
        //Define the data source for a minute
        const driver_source:driver_source = {
            type:'sql.fuel',
            sql,
            dbname:'tracker_mogaka',
            //
            //Use the minute.num field to row index the minutes 
            row_index:'num',
        }
        //
        //Create an homozone using the minute options
        const zone = new homozone({
            //
            //The zone has an id
            id:'minute_body',
            //
            //When you click on a cell...
            onclick:(cell:cell)=>this.cell_onclick(cell),
            //
            //Set size of the io text field  
            io_type:{type:'text', size:8},
            //
            driver_source,
            //
            //Add the autosaving to on losing focis of a minute
            onblur:async(cell:cell)=>await this.cell_onblur(cell),
            //
            //Force the column axis, just in case the minutes are empty. 
            //Remember the 'num' field is used for indexing, and therefore not
            //part of the homozone. In future, we will query the metadata of an 
            //sql to get the column indices 
            axes_source:[undefined, ['minute']]
        });
        //
        return zone;
    }

    //Select the first non-empty cell of the given homozone
    homozone_select(zone:homozone|undefined):void{
        //
        //Discontinue if the requested zone is empty
        if (!zone) return;
        //
        //Get the driver of the homozone
        const driver:obj<cell_value>|undefined = zone.driver;
        //
        //Discontinue the cell selection if there is no driver
        if (!driver) return;
        //
        //Get the indices of the first driver element
        const row:string|undefined =Object.keys(driver)[0];
        const col:string|undefined = Object.keys(driver[row])[0];
        //
        //Discontinue if either of the indices is not defined
        if (!(row && col)) return;
        //
        //Get teh indexed cell
        const cell:cell = zone.cells[row][col];
        //
        //Simulate a cliek event
        cell.td.click(); 
    }
   
}
